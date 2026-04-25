# Medical STT Full Stack

This repository implements the attached medical speech-to-text plan with:

- Angular 19 standalone frontend (`apps/web`)
- Node.js 22 API orchestrator (`apps/api`)
- FastAPI + Faster-Whisper microservice (`services/stt`)
- PostgreSQL + Prisma schema/migrations (`prisma`)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Copy `.env.example` to `.env` and adjust values for your machine.

## 3) Start PostgreSQL and STT/API with Docker

```bash
docker compose up --build
```

## 4) Run Prisma migrations and seed

```bash
npm run db:migrate
npm run db:generate
npm run db:seed
```

## 5) Run Angular app

```bash
npm --workspace apps/web run start
```

The frontend uses `proxy.conf.json` and calls `/api/upload-voice`.

## Plug-and-play test component

- Open `http://localhost:4200/voice-test`.
- Enter a `Visit ID`, click **Start recording**, then **Stop and upload**.
- The transcript is injected into a PrimeNG rich text editor so you can verify and tweak text quickly before integrating into your existing screens.

## Security and privacy notes

- API logging redacts authorization headers and transcript-like fields.
- Avoid writing PHI to shared logs or third-party telemetry.
