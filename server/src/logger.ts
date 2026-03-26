import fs from "fs";
import path from "path";
import { inspect } from "node:util";
import winston from "winston";
import { requestContext } from "./requestContext.js";

const isProduction = process.env.NODE_ENV === "production";

const injectRequestId = winston.format((info) => {
  const store = requestContext.getStore();
  if (store) {
    info.requestId = store.requestId;
  }
  return info;
})();

const fileFormat = winston.format.combine(
  injectRequestId,
  winston.format.timestamp(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  injectRequestId,
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.colorize({ all: false, level: true }),
  winston.format.printf((info) => {
    const ts = String(info.timestamp ?? "");
    const level = String(info.level ?? "");
    const rid = info.requestId ? ` [${info.requestId}]` : "";
    const msg =
      info.message !== undefined && info.message !== null
        ? String(info.message)
        : "";

    const rest: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(info)) {
      if (
        k === "level" ||
        k === "message" ||
        k === "timestamp" ||
        k === "requestId" ||
        k === "splat"
      ) {
        continue;
      }
      rest[k] = v;
    }

    const metaPretty =
      Object.keys(rest).length > 0
        ? `\n${inspect(rest, {
            colors: true,
            depth: 8,
            compact: false,
            breakLength: 100,
            maxArrayLength: 50,
            maxStringLength: 500,
          })}`
        : "";

    return `${ts} ${level}${rid} ${msg}${metaPretty}`;
  })
);

const level = process.env.LOG_LEVEL ?? "info";

function createTransports(): winston.transport[] {
  if (isProduction) {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const filename =
      process.env.LOG_FILE ?? path.join(logDir, "app.log");
    return [
      new winston.transports.File({
        filename,
        format: fileFormat,
      }),
    ];
  }
  return [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ];
}

export const logger = winston.createLogger({
  level,
  transports: createTransports(),
});
