import type { DashboardOverview, DashboardOverviewParams } from '@/types/dashboard';
import { get } from 'utils/request';

/**
 * 获取数据看板总览
 * @example
 * ```ts
 * const res = await reqGetDashboardOverview({ range: '7d' });
 * ```
 */
export const reqGetDashboardOverview = (params?: DashboardOverviewParams) =>
  get<DashboardOverview>('/qishui/dashboard/overview', params);
