import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { VoiceService } from "./voice.service";

@Component({
  selector: "app-voice-note",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section style="display: grid; gap: 0.75rem;">
      <label>
        Visit ID
        <input type="number" [(ngModel)]="visitId" style="margin-left: 0.5rem;" />
      </label>

      <div style="display: flex; gap: 0.5rem;">
        <button (click)="start()" [disabled]="recording">Start recording</button>
        <button (click)="stopAndUpload()" [disabled]="!recording">Stop and upload</button>
      </div>

      <p *ngIf="statusMessage">{{ statusMessage }}</p>
      <pre *ngIf="transcript">{{ transcript }}</pre>
    </section>
  `
})
export class VoiceNoteComponent {
  visitId = 1;
  recording = false;
  statusMessage = "";
  transcript = "";

  constructor(private readonly voiceService: VoiceService) {}

  async start(): Promise<void> {
    this.statusMessage = "Recording started.";
    this.transcript = "";
    await this.voiceService.startRecording();
    this.recording = true;
  }

  stopAndUpload(): void {
    this.statusMessage = "Uploading audio and transcribing...";
    this.voiceService.stopRecording(this.visitId).subscribe({
      next: (result) => {
        this.statusMessage = `Transcription completed for visit #${result.visitId}.`;
        this.transcript = result.transcript;
      },
      error: () => {
        this.statusMessage = "Upload/transcription failed.";
      },
      complete: () => {
        this.recording = false;
      }
    });
  }
}
