import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { EditorModule } from "primeng/editor";

import { VoiceService } from "./voice.service";

@Component({
  selector: "app-voice-test",
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  template: `
    <section style="display: grid; gap: 1rem;">
      <h2>Medical STT Test Component</h2>

      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <label for="visitId">Visit ID</label>
        <input id="visitId" type="number" [(ngModel)]="visitId" />
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button type="button" (click)="startRecording()" [disabled]="recording">
          Start recording
        </button>
        <button type="button" (click)="stopRecordingAndUpload()" [disabled]="!recording || loading">
          Stop and transcribe
        </button>
      </div>

      <p *ngIf="statusMessage">{{ statusMessage }}</p>

      <p-editor
        [(ngModel)]="editorHtml"
        [style]="{ height: '260px' }"
        placeholder="Transcript appears here after upload."
      ></p-editor>
    </section>
  `
})
export class VoiceTestComponent {
  visitId = 1;
  recording = false;
  loading = false;
  statusMessage = "Ready to test voice transcription.";
  editorHtml = "";

  constructor(private readonly voiceService: VoiceService) {}

  async startRecording(): Promise<void> {
    this.statusMessage = "Recording started...";
    this.loading = false;
    await this.voiceService.startRecording();
    this.recording = true;
  }

  stopRecordingAndUpload(): void {
    this.statusMessage = "Upload accepted. Transcription is processing...";
    this.loading = true;
    this.voiceService.stopRecording(this.visitId).subscribe({
      next: (result) => {
        this.editorHtml = result.transcript || "";
        this.statusMessage = `Transcription received for visit #${result.visitId}.`;
      },
      error: () => {
        this.statusMessage = "Failed to transcribe audio. Check API/STT services.";
      },
      complete: () => {
        this.recording = false;
        this.loading = false;
      }
    });
  }
}
