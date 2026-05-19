import { CommonModule } from '@angular/common';
import { Component, computed, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MoodPieChart } from './mood-pie-chart';
import { UserService } from './user.service';

interface CalendarDay {
  label: number;
  currentMonth: boolean;
  today: boolean;
  mood?: string;
  logged: boolean;
  key?: string;
}

interface MoodEntry {
  user_id: string;
  entry_date: string;
  mood: string;
  created_at: string;
}

interface ApiResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, MoodPieChart],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected readonly today = signal(new Date());
  protected readonly month = signal(this.today().getMonth());
  protected readonly year = signal(this.today().getFullYear());

  protected readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly moods = signal(new Map<string, string>());
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly moodModalOpen = signal(false);
  protected readonly customEmotions = signal<string[]>([]);
  protected readonly customEmotionInput = signal('');
  protected readonly chartVisible = signal(true);
  protected readonly loading = signal(false);

  private readonly moodApiRoute = 'https://zuey8ghnx3.execute-api.us-east-2.amazonaws.com/mood-tracker';

  private getUserId() {
    const username = this.userService.getUsername().trim();
    return username;
  }

  private getLoadUrl(date: string) {
    const userId = this.getUserId();
    const params = new URLSearchParams({ user_id: userId, date });
    return `${this.moodApiRoute}?${params.toString()}`;
  }

  private getSaveUrl() {
    return this.moodApiRoute;
  }

  protected readonly selectedMood = computed(() =>
    this.selectedDate() ? this.moods().get(this.selectedDate()!) : undefined
  );

  protected readonly monthName = computed(() => this.monthNames[this.month()]);

  constructor() {
    void this.initialize();
  }

  private async initialize() {
    const username = this.userService.getUsername().trim();
    if (!username) {
      void this.router.navigate(['/login']);
      return;
    }

    await this.loadMoods();
  }

  private readonly customMoodPalette = [
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#fb7185',
    '#f59e0b',
    '#3b82f6',
    '#22c55e',
    '#e11d48'
  ];

  private normalizeMood(value: string): string {
    const mood = value?.trim().toLowerCase();
    return mood === 'happy' || mood === 'neutral' || mood === 'sad' ? mood : mood || 'other';
  }

  protected getMoodColor(mood?: string): string {
    if (!mood) {
      return '#9ca3af';
    }

    const normalized = mood.trim().toLowerCase();
    switch (normalized) {
      case 'happy':
        return '#10b981';
      case 'neutral':
        return '#f59e0b';
      case 'sad':
        return '#ef4444';
      default: {
        const hash = [...normalized].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);
        return this.customMoodPalette[hash % this.customMoodPalette.length];
      }
    }
  }

  private async loadMoods() {
    this.loading.set(true);

    const username = this.userService.getUsername().trim();
    if (!username) {
      this.loading.set(false);
      return;
    }

    try {
      const monthDate = this.formatMonthDate(this.year(), this.month());
      const userId = this.getUserId();
      console.log('Loading moods for', { userId, monthDate });
      const url = this.getLoadUrl(monthDate);
      console.log('Fetching moods from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch mood entries from ${url}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      const moodMap = new Map<string, string>();

      // Handle items array from backend response
      if (data && typeof data === 'object' && Array.isArray(data.items)) {
        data.items.forEach((entry: MoodEntry) => {
          if (!entry.entry_date) {
            return;
          }
          moodMap.set(entry.entry_date, this.normalizeMood(entry.mood));
        });
      } else if (Array.isArray(data)) {
        // Fallback for array response
        data.forEach((entry: MoodEntry) => {
          if (!entry.entry_date) {
            return;
          }
          moodMap.set(entry.entry_date, this.normalizeMood(entry.mood));
        });
      } else if (data && typeof data === 'object' && 'date' in data) {
        // Fallback for single entry response
        moodMap.set(String(data.date), this.normalizeMood(String((data as any).mood)));
      }

      console.log('Processed mood map:', Object.fromEntries(moodMap));

      if (moodMap.size > 0) {
        console.log('Setting moods to signal with', moodMap.size, 'entries');
        // Merge with existing moods to preserve moods from other months
        const merged = new Map(this.moods());
        moodMap.forEach((mood, date) => merged.set(date, mood));
        this.moods.set(merged);
        console.log('Total moods after merge:', merged.size);
      } else {
        console.log('No moods found in backend response');
      }
    } catch (error) {
      console.error('Unable to load mood entries:', error);
    } finally {
      this.loading.set(false);
    }
  }

  protected readonly calendar = computed(() =>
    this.buildCalendar(this.year(), this.month(), this.today())
  );

  protected previousMonth() {
    const prev = new Date(this.year(), this.month() - 1, 1);
    this.month.set(prev.getMonth());
    this.year.set(prev.getFullYear());
    void this.loadMoods();
  }

  protected nextMonth() {
    const next = new Date(this.year(), this.month() + 1, 1);
    this.month.set(next.getMonth());
    this.year.set(next.getFullYear());
    void this.loadMoods();
  }

  protected resetToday() {
    const now = new Date();
    this.today.set(now);
    this.month.set(now.getMonth());
    this.year.set(now.getFullYear());
    void this.loadMoods();
  }

  protected onScroll(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY > 0) {
      this.nextMonth();
    } else if (event.deltaY < 0) {
      this.previousMonth();
    }
  }

  private pad(n: number) {
    return String(n).padStart(2, '0');
  }

  private formatDate(date: Date) {
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
  }

  private formatMonthDate(year: number, month: number) {
    return `${year}-${this.pad(month + 1)}`;
  }

  private keyFor(y: number, m: number, d: number) {
    return `${y}-${this.pad(m + 1)}-${this.pad(d)}`;
  }

  private getMoodForDate(y: number, m: number, d: number) {
    return this.moods().get(this.keyFor(y, m, d));
  }

  protected selectDay(day: CalendarDay) {
    if (!day.key) {
      return;
    }

    const parts = day.key.split('-').map((p) => Number(p));
    const y = parts[0];
    const m = parts[1] - 1;

    this.year.set(y);
    this.month.set(m);

    this.selectedDate.set(day.key);
    this.moodModalOpen.set(true);
  }

  protected async saveEntry(mood: string) {
    const selected = this.selectedDate();
    if (!selected) {
      return;
    }

    const exists = this.moods().has(selected);
    const updated = new Map(this.moods());
    updated.set(selected, mood);
    this.moods.set(updated);

    const result = await this.sendMoodToApi(selected, mood, exists);
    if (!result.success) {
      console.error('Failed to save mood to API:', result.error);
    }

    this.closeModal();
  }

  private async sendMoodToApi(date: string, mood: string, existingEntry: boolean): Promise<ApiResult> {
    const userId = this.getUserId();
    try {
      if (!date || !mood || !userId) {
        throw new Error('date, mood, and userId are required');
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      const payload = { user_id: userId, mood: String(mood), date: String(date) };
      const method = existingEntry ? 'PUT' : 'POST';

      console.log(`Sending ${method} to backend:`, payload);

      const response = await fetch(this.getSaveUrl(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`${method} failed:`, response.status, errorBody);
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      console.log(`${method} response:`, data);
      return { success: true, data };
    } catch (error) {
      console.error('Error saving mood to API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  protected saveCustomEmotion() {
    const name = this.customEmotionInput().trim();
    if (!name) return;

    // add to available custom emotions
    const current = [...this.customEmotions()];
    if (!current.includes(name)) {
      this.customEmotions.set([...current, name]);
    }

    // ensure selected date is set and save
    if (!this.selectedDate()) {
      const key = this.keyFor(this.today().getFullYear(), this.today().getMonth(), this.today().getDate());
      this.selectedDate.set(key);
    }

    this.saveEntry(name);
    this.customEmotionInput.set('');
  }

  protected removeCustomEmotion(emotion: string) {
    const current = [...this.customEmotions()];
    this.customEmotions.set(current.filter((em) => em !== emotion));
  }

  protected toggleChart() {
    this.chartVisible.set(!this.chartVisible());
  }

  protected closeModal() {
    this.moodModalOpen.set(false);
    this.selectedDate.set(null);
  }

  protected logCurrentMood() {
    const key = this.selectedDate() ?? this.keyFor(this.today().getFullYear(), this.today().getMonth(), this.today().getDate());
    const mood = this.moods().get(key);
    if (mood) {
      console.log(`Mood for ${key}: ${mood}`);
    } else {
      console.log(`No mood logged for ${key}`);
    }
  }

  private buildCalendar(year: number, month: number, today: Date): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    const daysWithMood: string[] = [];
    const daysWithoutMood: string[] = [];

    // Start from the first cell in the 6x7 grid; use Date overflow to compute cell dates
    const firstCell = new Date(year, month, 1);
    const startDay = firstCell.getDay();
    let day = 1 - startDay;

    for (let week = 0; week < 6; week++) {
      const weekDays: CalendarDay[] = [];

      for (let dow = 0; dow < 7; dow++, day++) {
        const cellDate = new Date(year, month, day);
        const currentMonth = cellDate.getMonth() === month;
        const displayDate = cellDate.getDate();

        const isToday =
          cellDate.getFullYear() === today.getFullYear() &&
          cellDate.getMonth() === today.getMonth() &&
          cellDate.getDate() === today.getDate();

        const key = this.keyFor(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
        const actualMood = this.getMoodForDate(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
        const mood = actualMood;

        if (currentMonth) {
          if (actualMood) {
            daysWithMood.push(`${displayDate}: ${actualMood}`);
          } else {
            daysWithoutMood.push(String(displayDate));
          }
        }

        weekDays.push({
          label: displayDate,
          currentMonth,
          today: isToday,
          mood,
          logged: actualMood !== undefined,
          key
        });
      }

      weeks.push(weekDays);
    }

    console.log(`Calendar for ${this.monthNames[month]} ${year}:`, {
      daysWithMood,
      daysWithoutMood,
      totalDaysInMonth: daysWithMood.length + daysWithoutMood.length
    });

    return weeks;
  }
}
