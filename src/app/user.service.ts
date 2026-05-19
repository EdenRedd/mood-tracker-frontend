import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  currentUser = signal<string>(localStorage.getItem('mood-tracker-user') || '');

  setUsername(username: string) {
    const trimmed = username.trim();
    this.currentUser.set(trimmed);
    if (trimmed) {
      localStorage.setItem('mood-tracker-user', trimmed);
    } else {
      localStorage.removeItem('mood-tracker-user');
    }
  }

  getUsername(): string {
    return this.currentUser();
  }
}
