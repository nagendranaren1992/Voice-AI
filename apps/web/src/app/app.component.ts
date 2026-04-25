import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main style="font-family: Arial, sans-serif; max-width: 920px; margin: 2rem auto; padding: 0 1rem;">
      <h1>Medical STT</h1>
      <router-outlet />
    </main>
  `
})
export class AppComponent {}
