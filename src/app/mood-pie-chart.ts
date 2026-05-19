import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart as ChartJS, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

interface MoodSummaryItem {
  mood: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-mood-pie-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="pie-chart-container">
      <h2>Mood Summary</h2>
      <div class="chart-wrapper">
        <canvas
          baseChart
          [type]="'pie'"
          [data]="chartData()"
          [options]="chartOptions"
        ></canvas>
      </div>
      <div class="mood-stats">
        <div *ngFor="let item of moodSummary()" class="stat-item">
          <span class="dot" [style.background]="item.color"></span>
          <span>{{ item.mood === 'other' ? 'Other' : (item.mood | titlecase) }}: {{ item.count }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pie-chart-container {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 24px 72px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.24);
      margin-top: 1.5rem;
    }

    h2 {
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
      color: #1d4ed8;
      font-weight: 600;
    }

    .chart-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
      max-width: 300px;
      margin-left: auto;
      margin-right: auto;
    }

    canvas {
      max-width: 100%;
      height: auto;
    }

    .mood-stats {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #111827;
      font-weight: 500;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
  `]
})
export class MoodPieChart {
  constructor() {
    ChartJS.register(PieController, ArcElement, Tooltip, Legend);
  }

  moods = input<Map<string, string>>(new Map());
  month = input<number>(0);
  year = input<number>(2024);

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

  private getMoodColor(mood: string): string {
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

  private normalizeMood(mood: string): string {
    const normalized = mood?.trim().toLowerCase();
    return normalized === 'happy' || normalized === 'neutral' || normalized === 'sad' ? normalized : normalized || 'other';
  }

  moodSummary = computed(() => {
    const moodMap = this.moods();
    const month = this.month();
    const year = this.year();
    const counts = new Map<string, number>();

    moodMap.forEach((mood, key) => {
      const [entryYear, entryMonth] = key.split('-').map(Number);
      if (entryYear === year && entryMonth === month + 1) {
        const normalizedMood = this.normalizeMood(mood);
        counts.set(normalizedMood, (counts.get(normalizedMood) ?? 0) + 1);
      }
    });

    return [...counts.entries()]
      .map(([mood, count]) => ({ mood, count, color: this.getMoodColor(mood) }))
      .sort((a, b) => {
        const order: Record<string, number> = { happy: 1, neutral: 2, sad: 3, other: 4 };
        const orderA = order[a.mood] ?? 5;
        const orderB = order[b.mood] ?? 5;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.mood.localeCompare(b.mood);
      });
  });

  chartData = computed(() => {
    const summary = this.moodSummary();

    return {
      labels: summary.map((item) =>
        item.mood === 'other' ? 'Other' : item.mood.charAt(0).toUpperCase() + item.mood.slice(1)
      ),
      datasets: [
        {
          data: summary.map((item) => item.count),
          backgroundColor: summary.map((item) => item.color),
          borderColor: summary.map((item) => item.color),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 4
        }
      ]
    };
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const summary = this.moodSummary();
            const total = summary.reduce((sum, item) => sum + item.count, 0);
            const value = context.parsed || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
}
