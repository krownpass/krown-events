"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuth } from "./auth-provider";
import { useQueryClient } from "@tanstack/react-query";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
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
  | { type: "EVENT_UPDATED"; payload: { event_id: string; field: string | string[]; value: MessageRecord; timestamp: string } }
  | { type: "ERROR"; code: string; message: string };

type MessageHandler = (message: WebSocketMessage) => void;

interface WebSocketContextType {
  isConnected: boolean;
  connectionId: string | null;
  send: (message: object) => void;
  subscribe: (handler: MessageHandler) => () => void;
  joinOrganizerRoom: (organizerId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, organizerId } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Set<MessageHandler>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const hasJoinedOrganizerRoomRef = useRef(false);
  const intentionalCloseRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const organizerIdRef = useRef<string | null>(null);
  const isAuthenticatedRef = useRef(false);
  const reconnectFnRef = useRef<(() => void) | null>(null);

  const MAX_RECONNECT_DELAY = 30000;
  const HEARTBEAT_INTERVAL = 25000;

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    organizerIdRef.current = organizerId;
  }, [organizerId]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((handler: MessageHandler) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  const broadcast = useCallback((message: WebSocketMessage) => {
    subscribersRef.current.forEach((handler) => {
      try {
        handler(message);
      } catch {}
    });
  }, []);

  const joinOrganizerRoom = useCallback((orgId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && orgId) {
      send({ type: "JOIN_ORGANIZER_ROOM", organizer_id: orgId });
      hasJoinedOrganizerRoomRef.current = true;
    }
  }, [send]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = setInterval(() => {
      send({ type: "PONG" });
    }, HEARTBEAT_INTERVAL);
  }, [send]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const patchEventCaches = useCallback(
    (eventId: string, patch: MessageRecord) => {
      queryClient.setQueryData(["events", "detail", eventId], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...(old as MessageRecord), ...patch };
      });

      queryClient.setQueriesData({ queryKey: ["events", "organizer", "list"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const payload = old as { data?: { events?: MessageRecord[] } };
        if (!payload.data?.events) return old;

        return {
          ...payload,
          data: {
            ...payload.data,
            events: payload.data.events.map((event) =>
              event?.event_id === eventId ? { ...event, ...patch } : event
            ),
          },
        };
      });

      queryClient.setQueriesData({ queryKey: ["events", "list"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const payload = old as { data?: { events?: MessageRecord[] } };
        if (!payload.data?.events) return old;

        return {
          ...payload,
          data: {
            ...payload.data,
            events: payload.data.events.map((event) =>
              event?.event_id === eventId ? { ...event, ...patch } : event
            ),
          },
        };
      });
    },
    [queryClient]
  );

  const connect = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!token) {
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    intentionalCloseRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "AUTH", token }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === "CONNECTED") {
          setConnectionId(message.connection_id);
          ws.send(JSON.stringify({ type: "AUTH", token }));
          return;
        }
        
        if (message.type === "AUTH_SUCCESS") {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          hasJoinedOrganizerRoomRef.current = false;
          startHeartbeat();
          
          const nextOrganizerId = organizerIdRef.current;
          if (nextOrganizerId) {
            if (!hasJoinedOrganizerRoomRef.current) {
              joinOrganizerRoom(nextOrganizerId);
            }
          }
          return;
        }
        
        if (message.type === "AUTH_REQUIRED") {
          ws.send(JSON.stringify({ type: "AUTH", token }));
          return;
        }
        
        if (message.type === "ERROR") {
          if (message.code === "AUTH_FAILED") {
            setIsConnected(false);
          }
          return;
        }
        
        if (message.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
          return;
        }
        
        if (message.type === "ORGANIZER_ROOM_JOINED") {
          hasJoinedOrganizerRoomRef.current = true;
          return;
        }

        if (message.type === "REGISTRATION_NEW") {
          const payload = message.payload;
          if (payload) {
            const eid = payload.event_id;
            if (eid) {
              patchEventCaches(eid, { current_registrations: payload.current_registrations });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "attendees"] });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "dashboard"] });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "waitlist"] });
              queryClient.invalidateQueries({ queryKey: ["events", "organizer"] });
              queryClient.invalidateQueries({ queryKey: ["events", "list"] });
            }
          }
          return;
        }

        if (message.type === "REGISTRATION_COUNT_UPDATED") {
          const eid = message.event_id;
          if (eid) {
            patchEventCaches(eid, { current_registrations: message.current_registrations });
            queryClient.invalidateQueries({ queryKey: ["events", eid, "dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["events", "organizer"] });
            queryClient.invalidateQueries({ queryKey: ["events", "list"] });
          }
          return;
        }

        if (message.type === "WAITLIST_NEW") {
          const payload = message.payload;
          if (payload) {
            const eid = payload.event_id;
            if (eid) {
              queryClient.invalidateQueries({ queryKey: ["events", eid, "waitlist"] });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "dashboard"] });
            }
          }
          return;
        }

        if (message.type === "EVENT_UPDATED") {
          const payload = message.payload;
          if (payload) {
            const eid = payload.event_id;
            if (eid) {
              patchEventCaches(eid, payload.value as MessageRecord);
              queryClient.invalidateQueries({ queryKey: ["events", "detail", eid] });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "dashboard"] });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "attendees"] });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "waitlist"] });
              queryClient.invalidateQueries({ queryKey: ["events", "organizer"] });
              queryClient.invalidateQueries({ queryKey: ["events", "list"] });
            }
          }
          return;
        }

        if (message.type === "REGISTRATION_TOGGLED") {
          const payload = message.payload;
          if (payload) {
            const eid = payload.event_id;
            if (eid) {
              patchEventCaches(eid, { is_registration_open: payload.is_registration_open });
              queryClient.invalidateQueries({ queryKey: ["events", eid, "dashboard"] });
              queryClient.invalidateQueries({ queryKey: ["events", "organizer"] });
              queryClient.invalidateQueries({ queryKey: ["events", "list"] });
            }
          }
          return;
        }

        broadcast(message);
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionId(null);
      hasJoinedOrganizerRoomRef.current = false;
      stopHeartbeat();

      if (!intentionalCloseRef.current && isAuthenticatedRef.current && tokenRef.current) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          if (!intentionalCloseRef.current) {
            reconnectFnRef.current?.();
          }
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [isAuthenticated, token, startHeartbeat, stopHeartbeat, joinOrganizerRoom, queryClient, broadcast, patchEventCaches]);

  useEffect(() => {
    reconnectFnRef.current = connect;
  }, [connect]);

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
    hasJoinedOrganizerRoomRef.current = false;
  }, [stopHeartbeat]);

  // Connect when authenticated and token is available
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Join organizer room when organizerId becomes available
  useEffect(() => {
    if (isConnected && organizerId && !hasJoinedOrganizerRoomRef.current) {
      joinOrganizerRoom(organizerId);
    }
  }, [isConnected, organizerId, joinOrganizerRoom]);

  const value: WebSocketContextType = useMemo(() => ({
    isConnected,
    connectionId,
    send,
    subscribe,
    joinOrganizerRoom,
  }), [isConnected, connectionId, send, subscribe, joinOrganizerRoom]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}
