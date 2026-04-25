FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY services/stt/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/stt ./services/stt

EXPOSE 8000

CMD ["uvicorn", "services.stt.main:app", "--host", "0.0.0.0", "--port", "8000"]
