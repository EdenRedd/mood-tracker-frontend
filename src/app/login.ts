import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main style="display:grid;place-items:center;min-height:100dvh;padding:1.5rem">
      <section style="background:white;padding:2rem;border-radius:1rem;box-shadow:0 10px 30px rgba(0,0,0,0.06);text-align:center;max-width:420px;">
        <h1 style="margin:0 0 0.5rem 0;">Welcome back</h1>
        <p style="margin:0 0 1rem 0;color:#6b7280;">This is a mock login screen. Click below to go to your calendar.</p>
        <a routerLink="/calendar"><button style="padding:0.6rem 1rem;border-radius:0.6rem;border:1px solid rgba(15,23,42,0.08);background:#2563eb;color:white;cursor:pointer;">Go to Calendar</button></a>
      </section>
    </main>
  `
})
export class Login {}
