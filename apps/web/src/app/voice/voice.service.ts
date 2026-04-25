import { Injectable, NgZone } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, firstValueFrom } from "rxjs";

interface UploadAcceptedResponse {
  visitId: number;
  status: "processing";
}

interface VisitStatusResponse {
  visit: {
    id: number;
    status: string;
    transcript: string | null;
  };
}

@Injectable({ providedIn: "root" })
export class VoiceService {
  private mediaRecorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private stream?: MediaStream;

  constructor(
    private readonly http: HttpClient,
    private readonly ngZone: NgZone
  ) {}

  async startRecording(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: "audio/webm"
    });
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
    this.mediaRecorder.start();
  }

  stopRecording(visitId: number): Observable<{ visitId: number; transcript: string }> {
    return new Observable((observer) => {
      if (!this.mediaRecorder) {
        observer.error(new Error("Recorder not initialized."));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("visitId", String(visitId));
        formData.append("file", blob, "voice-note.webm");

        this.http
          .post<UploadAcceptedResponse>("/api/upload-voice", formData)
          .subscribe({
            next: async (response) => {
              try {
                const finalResponse = await this.pollTranscriptUntilDone(response.visitId);
                this.ngZone.run(() => {
                  observer.next(finalResponse);
                  observer.complete();
                });
              } catch (error) {
                this.ngZone.run(() => observer.error(error));
              }
            },
            error: (error) => this.ngZone.run(() => observer.error(error)),
            complete: () => undefined
          });

        this.stream?.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.stop();
    });
  }

  private async pollTranscriptUntilDone(
    visitId: number
  ): Promise<{ visitId: number; transcript: string }> {
    const maxAttempts = 180;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await firstValueFrom(
        this.http.get<VisitStatusResponse>(`/api/patients/visits/${visitId}`)
      );

      if (response.visit.status === "completed") {
        return {
          visitId: response.visit.id,
          transcript: response.visit.transcript || ""
        };
      }

      if (response.visit.status === "failed") {
        throw new Error("Transcription failed.");
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    throw new Error("Transcription polling timed out.");
  }
}
