/** 看板时间范围 */
export type DashboardRange = 'today' | '7d' | '30d';

export type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'primary';

export interface DashboardMetricItem {
  key: string;
  label: string;
  value: number;
  desc: string;
  tone: MetricTone;
}

export interface DashboardTrendPoint {
  date: string;
  value: number;
  category: string;
}

export interface DashboardCreatorRankItem {
  id: string;
  account: string;
  nickname: string;
  totalCards: number;
  periodCreated: number;
  enabledCount: number;
  timeTypeCount: number;
  countTypeCount: number;
  totalParse: number;
  periodParse: number;
  successRate: number;
  activeCards: number;
  lastParseTime: string;
}

export interface DashboardCardRankItem {
  id: string;
  secret: string;
  creator: string;
  type: 'time' | 'count';
  periodParse: number;
  remainText: string;
  successRate: number;
  risk?: string;
}

export interface DashboardDistItem {
  type: string;
  value: number;
}

export interface DashboardOverview {
  canViewAll: boolean;
  metrics: DashboardMetricItem[];
  parseTrend: DashboardTrendPoint[];
  createTrend: DashboardTrendPoint[];
  creatorRank: DashboardCreatorRankItem[];
  hotCards: DashboardCardRankItem[];
  riskCards: DashboardCardRankItem[];
  typeDist: DashboardDistItem[];
  parseTypeDist: DashboardDistItem[];
  statusDist: DashboardDistItem[];
}

export interface DashboardOverviewParams {
  range?: DashboardRange;
  creatorId?: string;
}
