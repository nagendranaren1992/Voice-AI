import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, interval, switchMap, takeWhile } from "rxjs";

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

  constructor(private readonly http: HttpClient) {}

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
            next: (response) => {
              this.pollTranscript(response.visitId).subscribe({
                next: (finalResponse) => observer.next(finalResponse),
                error: (error) => observer.error(error),
                complete: () => observer.complete()
              });
            },
            error: (error) => observer.error(error),
            complete: () => undefined
          });

        this.stream?.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.stop();
    });
  }

  private pollTranscript(visitId: number): Observable<{ visitId: number; transcript: string }> {
    return new Observable((observer) => {
      interval(1200)
        .pipe(
          switchMap(() =>
            this.http.get<VisitStatusResponse>(`/api/patients/visits/${visitId}`)
          ),
          takeWhile((response) => response.visit.status === "processing", true)
        )
        .subscribe({
          next: (response) => {
            if (response.visit.status === "failed") {
              observer.error(new Error("Transcription failed."));
              return;
            }

            if (response.visit.status === "completed") {
              observer.next({
                visitId: response.visit.id,
                transcript: response.visit.transcript || ""
              });
            }
          },
          error: (error) => observer.error(error),
          complete: () => observer.complete()
        });
    });
  }
}
