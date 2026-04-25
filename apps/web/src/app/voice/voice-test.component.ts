import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { EditorModule } from "primeng/editor";

import { VoiceService } from "./voice.service";

@Component({
  selector: "app-voice-test",
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  styles: [
    `
      .editor-shell {
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #ffffff;
        overflow: hidden;
      }

      .editor-toolbar {
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 10px;
      }

      :host ::ng-deep .transcript-editor .p-editor-toolbar,
      :host ::ng-deep .transcript-editor .ql-toolbar,
      :host ::ng-deep .transcript-editor .ql-toolbar.ql-snow {
        display: none !important;
      }

      :host ::ng-deep .editor-toolbar .ql-picker {
        color: #334155;
      }

      :host ::ng-deep .editor-toolbar .ql-stroke {
        stroke: #334155;
      }

      :host ::ng-deep .editor-toolbar .ql-fill {
        fill: #334155;
      }

      :host ::ng-deep .editor-toolbar .ql-picker-options {
        z-index: 20;
      }

      :host ::ng-deep .transcript-editor .ql-toolbar.ql-snow {
        border: 0;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
        padding: 10px;
      }

      :host ::ng-deep .transcript-editor .ql-container.ql-snow {
        border: 0;
        font-size: 0.96rem;
        line-height: 1.5;
      }

      :host ::ng-deep .transcript-editor .ql-editor {
        min-height: 250px;
        color: #0f172a;
      }
    `
  ],
  template: `
    <section style="max-width: 900px; margin: 0 auto; padding: 1rem;">
      <header style="margin-bottom: 1rem;">
        <h2 style="margin: 0; font-size: 1.7rem; font-weight: 700; color: #0f172a;">Medical STT Test Console</h2>
        <p style="margin: 0.45rem 0 0; color: #475569; font-size: 0.95rem;">
          Record a voice note, submit it for transcription, and review/edit text below.
        </p>
      </header>

      <div
        style="
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          padding: 1rem;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          display: grid;
          gap: 1rem;
        "
      >
        <div style="display: flex; gap: 1.5rem; align-items: end; flex-wrap: wrap;">
          <div style="display: grid; gap: 0.4rem; min-width: 240px;">
            <label for="visitId" style="font-weight: 600; color: #334155; font-size: 0.9rem;">Visit ID</label>
            <input
              id="visitId"
              type="number"
              [(ngModel)]="visitId"
              style="
                height: 2.3rem;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 0 0.75rem;
                font-size: 0.95rem;
              "
            />
          </div>

          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <button
              type="button"
              (click)="startRecording()"
              [disabled]="recording || loading"
              style="
                height: 2.35rem;
                border: none;
                border-radius: 8px;
                padding: 0 0.9rem;
                font-weight: 600;
                cursor: pointer;
                background: #16a34a;
                color: #ffffff;
              "
            >
              Start recording
            </button>

            <button
              type="button"
              (click)="stopRecordingAndUpload()"
              [disabled]="!recording || loading"
              style="
                height: 2.35rem;
                border: none;
                border-radius: 8px;
                padding: 0 0.9rem;
                font-weight: 600;
                cursor: pointer;
                background: #2563eb;
                color: #ffffff;
              "
            >
              Stop and transcribe
            </button>
          </div>
        </div>

        <div
          style="
            border-radius: 8px;
            padding: 0.65rem 0.8rem;
            font-size: 0.92rem;
            font-weight: 500;
          "
          [style.background]="statusStyles.background"
          [style.color]="statusStyles.color"
        >
          {{ statusMessage }}
        </div>

        <div style="display: grid; gap: 0.45rem;">
          <div style="font-size: 0.9rem; color: #334155; font-weight: 600;">Transcript Editor</div>
          <div class="editor-shell">
            <div id="transcript-toolbar" class="editor-toolbar">
              <span class="ql-formats">
                <select class="ql-header">
                  <option value="1">Heading</option>
                  <option value="2">Subheading</option>
                  <option value="" selected>Normal</option>
                </select>
                <select class="ql-font">
                  <option value="sans-serif" selected>Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </span>
              <span class="ql-formats">
                <button class="ql-bold" aria-label="Bold"></button>
                <button class="ql-italic" aria-label="Italic"></button>
                <button class="ql-underline" aria-label="Underline"></button>
                <button class="ql-strike" aria-label="Strike"></button>
              </span>
              <span class="ql-formats">
                <select class="ql-color"></select>
                <select class="ql-background"></select>
              </span>
              <span class="ql-formats">
                <button class="ql-list" value="ordered" aria-label="Ordered list"></button>
                <button class="ql-list" value="bullet" aria-label="Bullet list"></button>
                <button class="ql-indent" value="-1" aria-label="Outdent"></button>
                <button class="ql-indent" value="+1" aria-label="Indent"></button>
                <select class="ql-align" aria-label="Align"></select>
              </span>
              <span class="ql-formats">
                <button class="ql-blockquote" aria-label="Blockquote"></button>
                <button class="ql-code-block" aria-label="Code block"></button>
                <button class="ql-link" aria-label="Link"></button>
                <button class="ql-image" aria-label="Image"></button>
                <button class="ql-clean" aria-label="Clear formatting"></button>
              </span>
            </div>
            <p-editor
              class="transcript-editor"
              [(ngModel)]="editorHtml"
              [modules]="editorModules"
              [style]="{ height: '320px' }"
              placeholder="Transcript appears here after upload."
            ></p-editor>
          </div>
        </div>
      </div>
    </section>
  `
})
export class VoiceTestComponent {
  visitId = 1;
  recording = false;
  loading = false;
  statusMessage = "Ready to test voice transcription.";
  editorHtml = "";
  editorModules = { toolbar: "#transcript-toolbar" };
  statusState: "idle" | "recording" | "processing" | "success" | "error" = "idle";

  constructor(private readonly voiceService: VoiceService) {}

  async startRecording(): Promise<void> {
    this.statusMessage = "Recording started...";
    this.statusState = "recording";
    this.loading = false;
    await this.voiceService.startRecording();
    this.recording = true;
  }

  stopRecordingAndUpload(): void {
    this.statusMessage = "Uploading audio and transcribing...";
    this.statusState = "processing";
    this.loading = true;
    this.voiceService.stopRecording(this.visitId, "sync").subscribe({
      next: (result) => {
        this.editorHtml = result.transcript || "";
        this.statusMessage = `Transcription received for visit #${result.visitId}.`;
        this.statusState = "success";
      },
      error: () => {
        this.statusMessage = "Failed to transcribe audio. Check API/STT services.";
        this.statusState = "error";
      },
      complete: () => {
        this.recording = false;
        this.loading = false;
      }
    });
  }

  get statusStyles(): { background: string; color: string } {
    switch (this.statusState) {
      case "recording":
        return { background: "#dcfce7", color: "#166534" };
      case "processing":
        return { background: "#dbeafe", color: "#1d4ed8" };
      case "success":
        return { background: "#ecfccb", color: "#3f6212" };
      case "error":
        return { background: "#fee2e2", color: "#b91c1c" };
      default:
        return { background: "#f1f5f9", color: "#334155" };
    }
  }
}
