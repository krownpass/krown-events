"use client";

import { useWebSocketContext } from "@/providers/websocket-provider";
import { useAuth } from "@/providers/auth-provider";

export function WebSocketDebug() {
  const { isConnected, connectionId } = useWebSocketContext();
  const { organizerId, user, isLoading: authLoading } = useAuth();

  if (process.env.NODE_ENV === "production") return null;

  const isOrganizer = user?.type === "org_user" && organizerId;
  const isAuthLoading = authLoading;

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg text-xs font-mono z-50 max-w-xs ${
      isAuthLoading ? "bg-gray-900/80" : isOrganizer ? "bg-green-900/80" : "bg-red-900/80"
    } text-white`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        <span>WS: {isConnected ? "Connected" : "Disconnected"}</span>
      </div>
      {connectionId && (
        <div className="truncate">ID: {connectionId.slice(0, 8)}...</div>
      )}
      <div className={`truncate ${!organizerId ? "text-red-300 font-bold" : ""}`}>
        Org: {organizerId || "NULL"}
      </div>
      <div className="truncate">User: {user?.email || "NULL"}</div>
      <div className={`truncate ${user?.type !== "org_user" ? "text-red-300 font-bold" : ""}`}>
        Type: {user?.type || "NULL"}
      </div>
      <div className="truncate">Role: {user?.role || "NULL"}</div>
      {isAuthLoading && (
        <div className="mt-2 text-yellow-300 font-bold">
          Loading...
        </div>
      )}
      {!isAuthLoading && !isOrganizer && (
        <div className="mt-2 text-red-300 font-bold">
          ⚠️ Login as organizer!
        </div>
      )}
    </div>
  );
}
