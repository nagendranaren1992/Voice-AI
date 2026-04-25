import { Router } from "express";

import { prisma } from "../prisma.js";

export const patientRouter = Router();
const processingStaleTimeoutMs = Number(process.env.PROCESSING_STALE_TIMEOUT_MS || "120000");

patientRouter.get("/", async (_req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    include: { visits: true }
  });
  res.json({ patients });
});

patientRouter.post("/visits", async (req, res) => {
  const patientId = Number(req.body.patientId);
  if (!patientId || Number.isNaN(patientId)) {
    return res.status(400).json({ error: "patientId is required." });
  }

  const visit = await prisma.visit.create({
    data: {
      patientId,
      status: "pending"
    }
  });

  return res.status(201).json({ visit });
});

patientRouter.get("/visits/:visitId", async (req, res) => {
  const visitId = Number(req.params.visitId);
  if (!visitId || Number.isNaN(visitId)) {
    return res.status(400).json({ error: "visitId is required." });
  }

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: { id: true, status: true, transcript: true, audioUrl: true, updatedAt: true }
  });

  if (!visit) {
    return res.status(404).json({ error: "Visit not found." });
  }

  if (visit.status === "processing") {
    const staleByMs = Date.now() - new Date(visit.updatedAt).getTime();
    if (staleByMs > processingStaleTimeoutMs) {
      const failedVisit = await prisma.visit.update({
        where: { id: visitId },
        data: { status: "failed" },
        select: { id: true, status: true, transcript: true, audioUrl: true }
      });
      return res.json({ visit: failedVisit });
    }
  }

  const responseVisit = {
    id: visit.id,
    status: visit.status,
    transcript: visit.transcript,
    audioUrl: visit.audioUrl
  };
  return res.json({ visit: responseVisit });
});
