import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoodPieChart } from './mood-pie-chart';

interface CalendarDay {
  label: number;
  currentMonth: boolean;
  today: boolean;
  mood?: string;
  logged: boolean;
  key?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, MoodPieChart],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
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

  protected readonly selectedMood = computed(() =>
    this.selectedDate() ? this.moods().get(this.selectedDate()!) : undefined
  );

  protected readonly monthName = computed(() => this.monthNames[this.month()]);

  constructor() {
    const y = this.year();
    const m = this.month();

    this.moods.set(
      new Map([
        [this.keyFor(y, m, 3), 'happy'],
        [this.keyFor(y, m, 7), 'neutral'],
        [this.keyFor(y, m, 12), 'sad'],
        [this.keyFor(y, m, this.today().getDate()), 'happy']
      ])
    );
  }

  protected readonly calendar = computed(() =>
    this.buildCalendar(this.year(), this.month(), this.today())
  );

  protected previousMonth() {
    const prev = new Date(this.year(), this.month() - 1, 1);
    this.month.set(prev.getMonth());
    this.year.set(prev.getFullYear());
  }

  protected nextMonth() {
    const next = new Date(this.year(), this.month() + 1, 1);
    this.month.set(next.getMonth());
    this.year.set(next.getFullYear());
  }

  protected resetToday() {
    const now = new Date();
    this.today.set(now);
    this.month.set(now.getMonth());
    this.year.set(now.getFullYear());
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

  protected saveEntry(mood: 'happy' | 'neutral' | 'sad') {
  protected saveEntry(mood: string) {
    const selected = this.selectedDate();
    if (!selected) {
      return;
    }

    const updated = new Map(this.moods());
    updated.set(selected, mood);
    this.moods.set(updated);
    this.closeModal();
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

    return weeks;
  }
}
