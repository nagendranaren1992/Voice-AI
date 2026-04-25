import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";

interface Visit {
  id: number;
  status: string;
  transcript: string | null;
  audioUrl: string | null;
  createdAt?: string;
}

interface Patient {
  id: number;
  uhid: string;
  name: string;
  visits: Visit[];
}

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section style="max-width: 1000px; margin: 0 auto; padding: 1rem;">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h2 style="margin: 0; color: #0f172a;">Patient Transcript Dashboard</h2>
          <p style="margin: 0.4rem 0 0; color: #475569; font-size: 0.92rem;">
            View all patients, visit statuses, and transcription output.
          </p>
        </div>
        <button
          type="button"
          (click)="loadPatients()"
          style="height: 2.2rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 0 0.8rem; cursor: pointer;"
        >
          Refresh
        </button>
      </header>

      <p *ngIf="loading" style="color: #1d4ed8;">Loading patients...</p>
      <p *ngIf="errorMessage" style="color: #b91c1c;">{{ errorMessage }}</p>

      <div *ngFor="let patient of patients" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem;">
          <div>
            <div style="font-weight: 700; color: #0f172a;">{{ patient.name }}</div>
            <div style="font-size: 0.88rem; color: #475569;">UHID: {{ patient.uhid }} | Patient ID: {{ patient.id }}</div>
          </div>
          <div style="font-size: 0.85rem; color: #64748b;">Visits: {{ patient.visits.length }}</div>
        </div>

        <div *ngIf="patient.visits.length === 0" style="color: #64748b; font-size: 0.9rem;">
          No visits yet.
        </div>

        <div *ngFor="let visit of patient.visits" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; margin-top: 0.65rem; background: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.9rem; font-weight: 600;">Visit #{{ visit.id }}</div>
            <span
              style="font-size: 0.8rem; border-radius: 999px; padding: 0.2rem 0.55rem; font-weight: 600;"
              [style.background]="statusStyle(visit.status).background"
              [style.color]="statusStyle(visit.status).color"
            >
              {{ visit.status }}
            </span>
          </div>
          <div style="margin-top: 0.45rem; font-size: 0.9rem; color: #334155; white-space: pre-wrap;">
            {{ visit.transcript || "Transcript not available yet." }}
          </div>
        </div>
      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  patients: Patient[] = [];
  loading = false;
  errorMessage = "";

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.errorMessage = "";
    this.http.get<{ patients: Patient[] }>("/api/patients").subscribe({
      next: (response) => {
        this.patients = response.patients || [];
      },
      error: () => {
        this.errorMessage = "Failed to fetch patients.";
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  statusStyle(status: string): { background: string; color: string } {
    const normalized = status.toLowerCase();
    if (normalized === "completed") {
      return { background: "#dcfce7", color: "#166534" };
    }
    if (normalized === "processing") {
      return { background: "#dbeafe", color: "#1d4ed8" };
    }
    if (normalized === "failed") {
      return { background: "#fee2e2", color: "#b91c1c" };
    }
    return { background: "#e2e8f0", color: "#334155" };
  }
}
