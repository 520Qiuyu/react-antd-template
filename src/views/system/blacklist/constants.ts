import type { BlacklistDuration, BlacklistSource, BlacklistStatus } from '@/types/blacklist';

/** 拦截开关 localStorage key */
export const IP_BLACKLIST_ENABLED_KEY = 'ip-blacklist-enabled';

/** 来源文案 */
export const BLACKLIST_SOURCE_TEXT_MAP: Record<BlacklistSource, string> = {
  manual: '手动拉黑',
  rate_limit: '限流自动',
};

/** 来源 Tag 色 */
export const BLACKLIST_SOURCE_COLOR_MAP: Record<BlacklistSource, string> = {
  manual: 'red',
  rate_limit: 'orange',
};

/** 来源筛选项 */
export const BLACKLIST_SOURCE_OPTIONS = [
  { label: '手动拉黑', value: 'manual' },
  { label: '限流自动', value: 'rate_limit' },
];

/** 状态文案 */
export const BLACKLIST_STATUS_TEXT_MAP: Record<BlacklistStatus, string> = {
  active: '生效中',
  unblocked: '已解除',
};

/** 状态筛选项 */
export const BLACKLIST_STATUS_OPTIONS = [
  { label: '生效中', value: 'active' },
  { label: '已解除', value: 'unblocked' },
];

/** 时长选项 */
export const BLACKLIST_DURATION_OPTIONS: { label: string; value: BlacklistDuration }[] = [
  { label: '1 小时', value: '1h' },
  { label: '24 小时', value: '24h' },
  { label: '7 天', value: '7d' },
  { label: '30 天', value: '30d' },
  { label: '永久', value: 'permanent' },
  { label: '自定义', value: 'custom' },
];
