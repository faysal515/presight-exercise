import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { Router } from "express";
import { sendSuccess } from "../lib/apiResponse.js";
import { enqueueJob } from "../lib/processWorker.js";
import { logger } from "../logger.js";

export const eventsRouter = Router();

/**
 * Queues a job in memory (pending), processes it in the worker thread (~2s),
 * then broadcasts completion over Socket.IO (`process:completed`).
 */
eventsRouter.post("/ws-process", (_req, res) => {
  const id = randomUUID();
  enqueueJob(id);
  return sendSuccess(res, { id, status: "pending" as const });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

eventsRouter.get("/stream", async (req, res, next) => {
  let aborted = false;
  const markAborted = () => {
    aborted = true;
  };
  req.on("aborted", markAborted);
  req.on("close", markAborted);

  try {
    const text = faker.lorem.paragraphs(6);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.flushHeaders();

    logger.info({
      message: "GET /api/events/stream start",
      dataLength: text.length,
    });

    for (const char of text) {
      if (aborted || req.destroyed || res.writableEnded) {
        break;
      }
      const isBufferAcked = res.write(char);
      if (!isBufferAcked) {
        // backpressure — wait for drain
        await new Promise<void>((resolve) => res.once("drain", resolve));
      }
      await delay(20);
    }

    if (!res.writableEnded) {
      res.end();
    }

    logger.info({ message: "GET /api/events/stream end" });
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});
