import io
import os
import tempfile
from threading import Lock
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

MODEL_NAME = os.getenv("WHISPER_MODEL", "large-v3")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
DEFAULT_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "en")
DEFAULT_BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "40"))
MEDICAL_PROMPT = os.getenv(
    "MEDICAL_INITIAL_PROMPT",
    "Transcribe medical dictation clearly, including drug names, vitals, units, and abbreviations."
)

app = FastAPI(title="Medical STT Service", version="1.0.0")
model_lock = Lock()
model: Optional[WhisperModel] = None


def get_model() -> WhisperModel:
    global model
    if model is None:
        with model_lock:
            if model is None:
                model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)
    return model


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = None,
    beam_size: Optional[int] = None
) -> JSONResponse:
    data = await file.read()
    if not data:
      raise HTTPException(status_code=400, detail="No audio bytes provided.")

    file_mb = len(data) / (1024 * 1024)
    if file_mb > MAX_UPLOAD_MB:
      raise HTTPException(
          status_code=413,
          detail=f"Audio file too large. Max allowed is {MAX_UPLOAD_MB} MB."
      )

    temp_path = ""
    try:
      extension = os.path.splitext(file.filename or "upload.webm")[1] or ".webm"
      with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
          tmp.write(data)
          temp_path = tmp.name

      stt_model = get_model()
      segments, info = stt_model.transcribe(
          temp_path,
          beam_size=beam_size or DEFAULT_BEAM_SIZE,
          language=language or DEFAULT_LANGUAGE,
          vad_filter=True,
          initial_prompt=MEDICAL_PROMPT
      )

      segment_list = [
          {"start": s.start, "end": s.end, "text": s.text.strip()} for s in segments
      ]
      text = " ".join([segment["text"] for segment in segment_list]).strip()

      return JSONResponse(
          {
              "text": text,
              "language": info.language,
              "duration": info.duration,
              "segments": segment_list
          }
      )
    except HTTPException:
      raise
    except Exception as error:
      raise HTTPException(status_code=500, detail=f"Transcription failed: {error}") from error
    finally:
      if temp_path and os.path.exists(temp_path):
          os.remove(temp_path)
