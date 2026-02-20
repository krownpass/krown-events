"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
type MessageRecord = Record<string, unknown>;

export type WebSocketMessage =
  | { type: "CONNECTED"; connection_id: string }
  | { type: "AUTH_SUCCESS"; user_id: string }
  | { type: "AUTH_REQUIRED"; message: string }
  | { type: "PING" }
  | { type: "PONG" }
  | { type: "ROOM_JOINED"; event_id: string; online_count: number }
  | { type: "ORGANIZER_ROOM_JOINED"; organizer_id: string }
  | { type: "ROOM_LEFT"; event_id: string }
  | { type: "SEAT_LOCKED"; event_id: string; seat_id: string; locked_by: string }
  | { type: "SEAT_UNLOCKED"; event_id: string; seat_id: string }
  | { type: "SEAT_BOOKED"; event_id: string; seat_id: string }
  | { type: "LOCK_CONFIRMED"; seat_id: string; expires_in: number }
  | { type: "LOCK_FAILED"; seat_id: string; reason: string }
  | { type: "LOCK_EXTENDED"; seat_ids: string[]; expires_in: number }
  | { type: "WAITLIST_UPDATE"; event_id: string; position: number; total: number }
  | { type: "WAITLIST_PROMOTED"; event_id: string; user_id: string }
  | { type: "WAITLIST_NEW"; payload: { event_id: string; waitlist_entry: MessageRecord; total_waitlist: number; timestamp: string } }
  | { type: "REGISTRATION_NEW"; payload: { event_id: string; registration: MessageRecord; current_registrations: number; timestamp: string } }
  | { type: "REGISTRATION_COUNT_UPDATED"; event_id: string; current_registrations: number }
  | { type: "REGISTRATION_TOGGLED"; payload: { event_id: string; is_registration_open: boolean; timestamp: string } }
  | { type: "EVENT_STATUS_CHANGED"; payload: { event_id: string; previous_status: string; new_status: string; timestamp: string } }
  | { type: "EVENT_UPDATED"; payload: { event_id: string; field: string; value: MessageRecord; timestamp: string } }
  | { type: "ERROR"; code: string; message: string };

interface UseWebSocketOptions {
  token?: string;
  eventId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  heartbeatInterval?: number;
}

export function useWebSocket({
  token,
  eventId,
  onMessage,
  onConnect,
  onDisconnect,
  autoReconnect = true,
  heartbeatInterval = 25000, // 25s (server expects pong within 30s)
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intentionalCloseRef = useRef(false);
  const reconnectFnRef = useRef<(() => void) | null>(null);
  const queryClient = useQueryClient();

  // Send a message through WebSocket
  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WS] Cannot send message - not connected");
    }
  }, []);

  // Join an event room
  const joinRoom = useCallback((roomEventId: string) => {
    send({ type: "JOIN_ROOM", event_id: roomEventId });
  }, [send]);

  // Leave an event room
  const leaveRoom = useCallback((roomEventId: string) => {
    send({ type: "LEAVE_ROOM", event_id: roomEventId });
  }, [send]);

  // Lock a seat
  const lockSeat = useCallback((seatEventId: string, seatId: string) => {
    send({ type: "LOCK_SEAT", event_id: seatEventId, seat_id: seatId });
  }, [send]);

  // Unlock a seat
  const unlockSeat = useCallback((seatEventId: string, seatId: string) => {
    send({ type: "UNLOCK_SEAT", event_id: seatEventId, seat_id: seatId });
  }, [send]);

  // Extend seat locks
  const extendLocks = useCallback((lockEventId: string, seatIds: string[]) => {
    send({ type: "EXTEND_LOCK", event_id: lockEventId, seat_ids: seatIds });
  }, [send]);

  // Request waitlist status
  const getWaitlistStatus = useCallback((waitlistEventId: string) => {
    send({ type: "WAITLIST_STATUS", event_id: waitlistEventId });
  }, [send]);

  // Pong response
  const sendPong = useCallback(() => {
    send({ type: "PONG" });
  }, [send]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Call user-provided handler
      onMessage?.(message);

      // Handle system messages
      switch (message.type) {
        case "CONNECTED":
          setConnectionId(message.connection_id);
          if (token) {
            send({ type: "AUTH", token });
          }
          break;

        case "AUTH_SUCCESS":
          setIsConnected(true);
          break;

        case "AUTH_REQUIRED":
          if (token) {
            send({ type: "AUTH", token });
          }
          break;

        case "PING":
          sendPong();
          break;

        case "ROOM_JOINED":
          setOnlineCount(message.online_count);
          console.log("[WS] Joined room:", message.event_id, `(${message.online_count} online)`);
          break;

        case "SEAT_LOCKED":
        case "SEAT_UNLOCKED":
        case "SEAT_BOOKED":
          // Invalidate seat map cache for this event
          queryClient.invalidateQueries({
            queryKey: ["events", message.event_id, "seats"]
          });
          break;

        case "LOCK_CONFIRMED":
          // Invalidate user's lock status
          queryClient.invalidateQueries({
            queryKey: ["seats", "my-locks"]
          });
          break;

        case "WAITLIST_UPDATE":
        case "WAITLIST_PROMOTED":
          // Invalidate waitlist queries
          queryClient.invalidateQueries({
            queryKey: ["events", message.event_id, "waitlist"]
          });
          break;

        case "WAITLIST_NEW":
          // Invalidate waitlist queries
          queryClient.invalidateQueries({
            queryKey: ["events", message.payload.event_id, "waitlist"]
          });
          break;

        case "ERROR":
          break;
      }
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
    }
  }, [onMessage, sendPong, queryClient, send, token]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      sendPong();
    }, heartbeatInterval);
  }, [heartbeatInterval, sendPong]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token) {
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    intentionalCloseRef.current = false;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "AUTH", token }));
      setIsConnected(true);
      startHeartbeat();
      onConnect?.();

      // Auto-join room if eventId provided
      if (eventId) {
        setTimeout(() => joinRoom(eventId), 100);
      }
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {};

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionId(null);
      stopHeartbeat();
      onDisconnect?.();

      if (autoReconnect && !intentionalCloseRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectFnRef.current?.();
        }, 5000);
      }
    };

    wsRef.current = ws;
  }, [token, eventId, autoReconnect, handleMessage, startHeartbeat, stopHeartbeat, onConnect, onDisconnect, joinRoom]);

  useEffect(() => {
    reconnectFnRef.current = connect;
  }, [connect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionId(null);
  }, [stopHeartbeat]);

  // Auto-connect when token changes
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]); // Only reconnect when token changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [stopHeartbeat]);

  return {
    isConnected,
    connectionId,
    onlineCount,
    connect,
    disconnect,
    send,
    joinRoom,
    leaveRoom,
    lockSeat,
    unlockSeat,
    extendLocks,
    getWaitlistStatus,
  };
}
