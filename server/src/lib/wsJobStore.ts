export type WsJobStatus = "pending" | "completed";

export type WsJobEntry = {
  status: WsJobStatus;
  result?: string;
};

export const wsJobs = new Map<string, WsJobEntry>();

/** FIFO queue of in-flight job ids (pending until worker completes). */
export const pendingJobQueue: string[] = [];

export function setPending(id: string): void {
  wsJobs.set(id, { status: "pending" });
}

/**
 * Enqueue a job: store as pending and append to the in-memory queue.
 */
export function enqueuePendingJob(id: string): void {
  setPending(id);
  pendingJobQueue.push(id);
}

export function completeJob(id: string, result: string): void {
  wsJobs.set(id, { status: "completed", result });
  const idx = pendingJobQueue.indexOf(id);
  if (idx !== -1) {
    pendingJobQueue.splice(idx, 1);
  }
}
