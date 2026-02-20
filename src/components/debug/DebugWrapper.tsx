"use client";

import dynamic from "next/dynamic";

const WebSocketDebug = dynamic(
  () => import("@/components/debug/WebSocketDebug").then((mod) => mod.WebSocketDebug),
  { ssr: false }
);

export function DebugWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WebSocketDebug />
    </>
  );
}
