import axios from "axios";
import FormData from "form-data";

const sttBaseUrl = process.env.STT_SERVICE_URL || "http://localhost:8000";
const sttTimeoutMs = Number(process.env.STT_TIMEOUT_MS || "120000");
const maxRetries = Number(process.env.STT_RETRIES || "2");

export async function transcribeAudio(
  originalName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<string> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const form = new FormData();
      form.append("file", fileBuffer, {
        filename: originalName,
        contentType: mimeType
      });

      const response = await axios.post(`${sttBaseUrl}/transcribe`, form, {
        headers: form.getHeaders(),
        timeout: sttTimeoutMs,
        maxBodyLength: Infinity
      });

      return response.data?.text || "";
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > maxRetries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw lastError;
}
