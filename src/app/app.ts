import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CalendarDay {
  label: number;
  currentMonth: boolean;
  today: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  protected readonly monthName = computed(() => this.monthNames[this.month()]);

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

  private buildCalendar(year: number, month: number, today: Date): CalendarDay[][] {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const startDay = firstOfMonth.getDay();

    const weeks: CalendarDay[][] = [];
    let day = 1 - startDay;

    for (let week = 0; week < 6; week++) {
      const weekDays: CalendarDay[] = [];

      for (let dow = 0; dow < 7; dow++, day++) {
        const currentMonth = day >= 1 && day <= daysInMonth;
        const displayDate = currentMonth
          ? day
          : day < 1
          ? prevMonthDays + day
          : day - daysInMonth;

        const isToday =
          currentMonth &&
          year === today.getFullYear() &&
          month === today.getMonth() &&
          displayDate === today.getDate();

        weekDays.push({
          label: displayDate,
          currentMonth,
          today: isToday
        });
      }

      weeks.push(weekDays);
    }

    return weeks;
  }
}
