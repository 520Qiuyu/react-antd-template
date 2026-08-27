import type { DashboardRange } from '@/types/dashboard';

export const TIME_RANGE_OPTIONS: { label: string; value: DashboardRange }[] = [
  { label: '今日', value: 'today' },
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
];
