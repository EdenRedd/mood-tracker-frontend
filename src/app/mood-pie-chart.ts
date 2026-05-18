import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

interface MoodStats {
  happy: number;
  neutral: number;
  sad: number;
  other: number;
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
        <div class="stat-item happy">
          <span class="dot"></span>
          <span>Happy: {{ stats().happy }}</span>
        </div>
        <div class="stat-item neutral">
          <span class="dot"></span>
          <span>Neutral: {{ stats().neutral }}</span>
        </div>
        <div class="stat-item sad">
          <span class="dot"></span>
          <span>Sad: {{ stats().sad }}</span>
        </div>
        <div class="stat-item other">
          <span class="dot"></span>
          <span>Other: {{ stats().other }}</span>
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

    .stat-item.happy .dot {
      background: #10b981;
    }

    .stat-item.neutral .dot {
      background: #f59e0b;
    }

    .stat-item.sad .dot {
      background: #ef4444;
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
  moods = input<Map<string, string>>(new Map());
  month = input<number>(0);
  year = input<number>(2024);

  stats = computed(() => {
    const moodMap = this.moods();
    const m = this.month();
    const y = this.year();
    const stats: MoodStats = { happy: 0, neutral: 0, sad: 0, other: 0 };

    moodMap.forEach((mood, key) => {
      const [year, month, day] = key.split('-').map(Number);
      if (year === y && month === m + 1) {
        if (mood === 'happy' || mood === 'neutral' || mood === 'sad') {
          // @ts-ignore
          stats[mood]++;
        } else {
          stats.other++;
        }
      }
    });

    return stats;
  });

  chartData = computed(() => {
    const s = this.stats();
    const total = s.happy + s.neutral + s.sad + s.other;

    return {
      labels: ['Happy', 'Neutral', 'Sad', 'Other'],
      datasets: [
        {
          data: [s.happy, s.neutral, s.sad, s.other],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#9ca3af'],
          borderColor: ['#059669', '#d97706', '#dc2626', '#6b7280'],
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
            const stats = this.stats();
            const total = stats.happy + stats.neutral + stats.sad + stats.other;
            const value = context.parsed || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
}
