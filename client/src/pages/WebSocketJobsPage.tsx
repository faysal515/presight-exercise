import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { postWsProcess } from "../api/eventsApi.js";

type JobRow = {
  id: string;
  status: "pending" | "completed";
  result?: string;
};

type SocketConn = "disconnected" | "connecting" | "connected";

export function WebSocketJobsPage() {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [socketState, setSocketState] = useState<SocketConn>("disconnected");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSocketState("connecting");
    const socket: Socket = io({
      path: "/ws",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    const onConnect = () => setSocketState("connected");
    const onDisconnect = () => setSocketState("disconnected");
    const onConnectError = () => setSocketState("disconnected");

    const onCompleted = (payload: {
      id: string;
      status: "completed";
      result: string;
    }) => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === payload.id
            ? { ...row, status: "completed", result: payload.result }
            : row
        )
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("process:completed", onCompleted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("process:completed", onCompleted);
      socket.disconnect();
    };
  }, []);

  const runTwenty = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const results = await Promise.all(
        Array.from({ length: 20 }, () => postWsProcess())
      );
      setRows(
        results.map((r) => ({
          id: r.id,
          status: "pending" as const,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enqueue jobs");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden">
        <div className="shrink-0 space-y-2 border-b border-slate-800/80 pb-4">
          <h1 className="text-lg font-semibold text-white">Worker jobs</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-sky-300">
              POST /api/events/ws-process
            </code>{" "}
            enqueues a job in memory and returns{" "}
            <code className="text-slate-300">pending</code>. A worker thread
            completes each job after ~2s and emits{" "}
            <code className="text-slate-300">process:completed</code> over
            Socket.IO. This page connects on load and disconnects when you
            navigate away.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                socketState === "connected"
                  ? "bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-800"
                  : socketState === "connecting"
                    ? "bg-amber-950/80 text-amber-200 ring-1 ring-amber-800"
                    : "bg-slate-800 text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  socketState === "connected"
                    ? "bg-emerald-400"
                    : socketState === "connecting"
                      ? "animate-pulse bg-amber-400"
                      : "bg-slate-500"
                }`}
              />
              Socket:{" "}
              {socketState === "connected"
                ? "connected"
                : socketState === "connecting"
                  ? "connecting…"
                  : "disconnected"}
            </span>
            <button
              type="button"
              onClick={runTwenty}
              disabled={busy || socketState !== "connected"}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Enqueueing…" : "Send 20 requests"}
            </button>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">
              Connect the socket, then send 20 requests to see pending →
              result per row.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {rows.map((row, i) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      #{i + 1}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        row.status === "pending"
                          ? "bg-amber-950/80 text-amber-200 ring-1 ring-amber-800"
                          : "bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-800"
                      }`}
                    >
                      {row.status === "pending" ? "pending" : "result"}
                    </span>
                  </div>
                  <p className="mb-2 truncate font-mono text-[10px] text-slate-500">
                    {row.id}
                  </p>
                  {row.status === "pending" ? (
                    <p className="text-xs text-slate-500">Waiting…</p>
                  ) : (
                    <p className="text-xs leading-snug text-slate-200">
                      {row.result}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
