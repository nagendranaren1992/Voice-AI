import fs from "node:fs/promises";
import path from "node:path";

import { Router } from "express";
import multer from "multer";

import { logger } from "../logger.js";
import { prisma } from "../prisma.js";
import { transcribeAudio } from "../services/sttClient.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || "40") * 1024 * 1024 }
});
const transcriptionJobTimeoutMs = Number(process.env.TRANSCRIPTION_JOB_TIMEOUT_MS || "90000");

export const uploadVoiceRouter = Router();

async function processTranscription(
  visitId: number,
  originalName: string,
  mimeType: string,
  fileBuffer: Buffer,
  filePath: string
): Promise<void> {
  try {
    const transcript = await Promise.race<string>([
      transcribeAudio(originalName, mimeType, fileBuffer),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Transcription timed out.")), transcriptionJobTimeoutMs);
      })
    ]);

    await prisma.visit.update({
      where: { id: visitId },
      data: {
        audioUrl: filePath,
        transcript,
        status: "completed"
      }
    });
  } catch (error) {
    logger.error({ error, visitId }, "transcription job failed");
    await prisma.visit.update({
      where: { id: visitId },
      data: { status: "failed" }
    });
  }
}

uploadVoiceRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    const mode = String(req.body.mode || req.query.mode || "sync").toLowerCase();
    const visitId = Number(req.body.visitId);
    if (!visitId || Number.isNaN(visitId)) {
      return res.status(400).json({ error: "visitId is required and must be numeric." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "file is required." });
    }

    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) {
      return res.status(404).json({ error: "Visit not found." });
    }

    const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.resolve("apps/api/uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, req.file.buffer);

    await prisma.visit.update({
      where: { id: visitId },
      data: {
        audioUrl: filePath,
        status: "processing"
      }
    });

    if (mode === "sync") {
      try {
        const transcript = await Promise.race<string>([
          transcribeAudio(
            req.file.originalname || safeName,
            req.file.mimetype,
            req.file.buffer
          ),
          new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error("Transcription timed out.")), transcriptionJobTimeoutMs);
          })
        ]);

        const updatedVisit = await prisma.visit.update({
          where: { id: visitId },
          data: { transcript, status: "completed" }
        });

        return res.json({
          visitId: updatedVisit.id,
          status: "completed",
          transcript: updatedVisit.transcript || ""
        });
      } catch (error) {
        logger.error({ error, visitId }, "sync transcription failed");
        await prisma.visit.update({
          where: { id: visitId },
          data: { status: "failed" }
        });
        return res.status(500).json({ error: "Transcription failed." });
      }
    }

    void processTranscription(
      visitId,
      req.file.originalname || safeName,
      req.file.mimetype,
      req.file.buffer,
      filePath
    );

    return res.status(202).json({ visitId, status: "processing" });
  } catch (error) {
    logger.error({ error }, "upload-voice failed");
    return res.status(500).json({ error: "Failed to process speech upload." });
  }
});
