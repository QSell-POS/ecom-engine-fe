"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { chatSocketTokenAction } from "@/lib/api/chat/action";

/** Event name → handler. `never` accepts handlers typed for their own event's payload. */
export type ChatSocketHandlers = Record<string, (payload: never) => void>;

/**
 * The inbox's live connection. Each (re)connect fetches a fresh one-minute
 * token through a server action, so the admin session token never reaches the
 * browser. `onConnect` runs after every successful (re)connect: anything that
 * happened while disconnected has to be re-read there.
 *
 * Handlers are read through a ref, so passing a new object each render never
 * reconnects.
 */
export function useChatSocket(handlers: ChatSocketHandlers, onConnect?: (socket: Socket) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  const onConnectRef = useRef(onConnect);
  useEffect(() => {
    handlersRef.current = handlers;
    onConnectRef.current = onConnect;
  });

  useEffect(() => {
    let cancelled = false;
    let active: Socket | null = null;

    (async () => {
      const first = await chatSocketTokenAction();
      if (cancelled || !first?.data) return;

      let pending: string | null = first.data.token;
      active = io(first.data.url, {
        transports: ["websocket"],
        // Called before every handshake attempt; reuse the first token once, then ask again.
        auth: (cb) => {
          if (pending) {
            const token = pending;
            pending = null;
            return cb({ token });
          }
          chatSocketTokenAction()
            .then((result) => cb({ token: result?.data?.token ?? "" }))
            .catch(() => cb({ token: "" }));
        },
        reconnectionDelayMax: 10_000,
      });

      // "ready", not "connect": the server sends it once it knows who this is, and
      // a join sent before then would be ignored.
      active.on("ready", () => {
        setConnected(true);
        if (active) onConnectRef.current?.(active);
      });
      active.on("disconnect", () => setConnected(false));
      active.onAny((event: string, payload: unknown) => {
        const handler = handlersRef.current[event] as ((payload: unknown) => void) | undefined;
        handler?.(payload);
      });
      setSocket(active);
    })();

    return () => {
      cancelled = true;
      active?.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return { socket, connected };
}
