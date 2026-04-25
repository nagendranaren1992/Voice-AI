import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: ["req.body.transcript", "transcript", "body.transcript", "headers.authorization"],
    remove: true
  }
});
