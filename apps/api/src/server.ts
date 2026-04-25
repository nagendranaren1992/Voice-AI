import "dotenv/config";

import cors from "cors";
import express from "express";

import { logger } from "./logger.js";
import { patientRouter } from "./routes/patients.js";
import { uploadVoiceRouter } from "./routes/uploadVoice.js";

const app = express();
const port = Number(process.env.PORT || "3000");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200"
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/patients", patientRouter);
app.use("/api/upload-voice", uploadVoiceRouter);

app.listen(port, () => {
  logger.info(`API server listening on port ${port}`);
});
