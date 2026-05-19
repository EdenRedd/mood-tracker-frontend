import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { UserService } from './user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main style="display:grid;place-items:center;min-height:100dvh;padding:1.5rem">
      <section style="background:white;padding:2rem;border-radius:1rem;box-shadow:0 10px 30px rgba(0,0,0,0.06);text-align:center;max-width:420px;">
        <h1 style="margin:0 0 1rem 0;">Welcome to Mood Tracker</h1>
        <p style="margin:0 0 1.5rem 0;color:#6b7280;">Enter your username to get started</p>
        
        <div style="margin-bottom:1rem;">
          <input
            type="text"
            [value]="username()"
            (input)="username.set($any($event.target).value)"
            placeholder="Enter your username"
            style="width:100%;padding:0.75rem;border-radius:0.6rem;border:1px solid rgba(15,23,42,0.12);font-size:1rem;box-sizing:border-box;"
          />
        </div>
        
        <button 
          (click)="login()" 
          [disabled]="!username().trim()"
          style="padding:0.6rem 1rem;border-radius:0.6rem;border:1px solid rgba(15,23,42,0.08);background:#2563eb;color:white;cursor:pointer;width:100%;font-weight:500;font-size:1rem;"
          [style.opacity]="!username().trim() ? '0.5' : '1'"
          [style.cursor]="!username().trim() ? 'not-allowed' : 'pointer'"
        >
          Go to Calendar
        </button>
      </section>
    </main>
  `
})
export class Login {
  username = signal<string>('');

  constructor(private userService: UserService, private router: Router) {}

  login() {
    const user = this.username().trim();
    if (user) {
      this.userService.setUsername(user);
      void this.router.navigate(['/calendar']);
    }
  }
}
