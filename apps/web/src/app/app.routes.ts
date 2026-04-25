import { Routes } from "@angular/router";

export const appRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboard"
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./dashboard/dashboard.component").then((m) => m.DashboardComponent)
  },
  {
    path: "voice-test",
    loadComponent: () =>
      import("./voice/voice-test.component").then((m) => m.VoiceTestComponent)
  },
  {
    path: "voice-note",
    loadComponent: () =>
      import("./voice/voice-note.component").then((m) => m.VoiceNoteComponent)
  }
];
