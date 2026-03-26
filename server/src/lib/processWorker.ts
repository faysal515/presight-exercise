import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { logger } from "../logger.js";
import { completeJob, enqueuePendingJob } from "./wsJobStore.js";
import { getIo } from "./socket.js";

const workerPath = fileURLToPath(new URL("../worker.js", import.meta.url));

const worker = new Worker(workerPath);

worker.on("message", (msg: { id: string; result: string }) => {
  completeJob(msg.id, msg.result);
  try {
    getIo().emit("process:completed", {
      id: msg.id,
      status: "completed" as const,
      result: msg.result,
    });
  } catch (e) {
    logger.error({ err: e, message: "Socket.IO broadcast failed" });
  }
});

worker.on("error", (err) => {
  logger.error({ err, message: "Worker thread error" });
});

/**
 * Enqueue a job in the in-memory queue and hand it to the worker thread.
 */
export function enqueueJob(id: string): void {
  enqueuePendingJob(id);
  worker.postMessage({ id });
}
