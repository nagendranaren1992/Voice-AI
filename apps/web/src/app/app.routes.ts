import { Routes } from "@angular/router";

export const appRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "voice-test"
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
