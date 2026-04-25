import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <main style="font-family: Arial, sans-serif; max-width: 920px; margin: 2rem auto; padding: 0 1rem;">
      <h1>Medical STT</h1>
      <nav style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <a
          routerLink="/dashboard"
          routerLinkActive="active-link"
          style="text-decoration: none; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.35rem 0.7rem; color: #0f172a;"
        >
          Dashboard
        </a>
        <a
          routerLink="/voice-test"
          routerLinkActive="active-link"
          style="text-decoration: none; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.35rem 0.7rem; color: #0f172a;"
        >
          Voice Test
        </a>
      </nav>
      <router-outlet />
    </main>
  `
})
export class AppComponent {}
