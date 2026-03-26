import { useCallback, useRef, useState } from "react";

type StreamStatus = "idle" | "streaming" | "done" | "error" | "cancelled";

export function StreamPage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runStream = useCallback(async (signal: AbortSignal) => {
    setText("");
    setErrorMsg(null);
    setStatus("streaming");

    try {
      const res = await fetch("/api/events/stream", { signal });
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(`Request failed (${res.status} ${res.statusText})`);
        return;
      }
      if (!res.body) {
        setStatus("error");
        setErrorMsg("Streaming is not supported in this browser.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && !signal.aborted) {
          setText((prev) => prev + decoder.decode(value, { stream: true }));
        }
      }
      if (signal.aborted) {
        setStatus("cancelled");
        return;
      }
      setText((prev) => prev + decoder.decode());
      setStatus("done");
    } catch (e) {
      if (
        signal.aborted ||
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError")
      ) {
        setStatus("cancelled");
        return;
      }
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Stream failed");
    }
  }, []);

  const start = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    void runStream(ac.signal);
  }, [runStream]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus((s) => (s === "streaming" ? "cancelled" : s));
  }, []);

  const statusLabel: Record<StreamStatus, string> = {
    idle: "Ready",
    streaming: "Receiving…",
    done: "Complete",
    error: "Error",
    cancelled: "Stopped",
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4">
        <div className="shrink-0 space-y-2 border-b border-slate-800/80 pb-4">
          <h1 className="text-lg font-semibold text-white">Text stream</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Live chunked response from{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-sky-300">
              GET /api/events/stream
            </code>
            . Characters arrive gradually from the server.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={start}
              disabled={status === "streaming"}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "streaming"
                ? "Streaming…"
                : status === "idle"
                  ? "Start stream"
                  : "Restart stream"}
            </button>
            <button
              type="button"
              onClick={stop}
              disabled={status !== "streaming"}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Stop
            </button>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status === "streaming"
                  ? "bg-amber-950/80 text-amber-200 ring-1 ring-amber-800"
                  : status === "done"
                    ? "bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-800"
                    : status === "error"
                      ? "bg-red-950/80 text-red-200 ring-1 ring-red-800"
                      : "bg-slate-800 text-slate-400"
              }`}
            >
              {statusLabel[status]}
            </span>
          </div>
          {errorMsg ? (
            <p role="alert" className="text-sm text-red-300">
              {errorMsg}
            </p>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-4 font-mono text-sm leading-relaxed text-slate-200">
            {text}
            {status === "streaming" ? (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-sky-400 align-middle" />
            ) : null}
          </pre>
        </div>
      </div>
    </div>
  );
}
