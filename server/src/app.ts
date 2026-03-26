import "dotenv/config";
import { createServer } from "node:http";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import { sendError, sendSuccess } from "./lib/apiResponse.js";
import { setIo } from "./lib/socket.js";
import { logger } from "./logger.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { eventsRouter } from "./routes/events.js";
import { usersRouter } from "./routes/users.js";
import { runStartupScript } from "./startup/seedMongo.js";

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === "") {
    return 3000;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${raw}`);
  }
  return port;
}

function getErrorStatus(err: unknown): number {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 600) {
      return status;
    }
  }
  return 500;
}

export const app = express();

app.use(helmet());
app.use(cors());
app.use(requestIdMiddleware);
app.use(express.json());

app.get("/health", (_req, res) => {
  logger.info("Health check.");
  return sendSuccess(res, { ok: true });
});

app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);

app.use((_req, res) => {
  sendError(res, 404, "Not found");
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err });
  const status = getErrorStatus(err);
  const message =
    status >= 500
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Request error";
  if (res.headersSent) {
    return;
  }
  sendError(res, status, message);
});

async function bootstrap(): Promise<void> {
  await runStartupScript();

  const port = parsePort(process.env.PORT);
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    path: "/ws",
    cors: { origin: true, methods: ["GET", "POST"] },
  });
  setIo(io);

  io.engine.on("connection_error", (err) => {
    logger.warn({
      message: "Socket.IO engine connection_error",
      description: err.message,
      context: err.context,
    });
  });

  io.on("connection", (socket) => {
    logger.info({
      message: "Socket.IO client connected",
      socketId: socket.id,
      transport: socket.conn.transport.name,
    });
    socket.on("disconnect", (reason) => {
      logger.info({
        message: "Socket.IO client disconnected",
        socketId: socket.id,
        reason,
      });
    });
  });

  httpServer.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

bootstrap().catch((err: unknown) => {
  logger.error({ err });
  process.exit(1);
});
