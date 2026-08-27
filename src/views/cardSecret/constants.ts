import type { CardSecretType } from '@/types/cardSecret';

/** 卡密类型选项 */
export const CARD_SECRET_TYPE_OPTIONS = [
  { label: '按时间', value: 'time' as const },
  { label: '按数量', value: 'count' as const },
];

/** 卡密类型文案映射 */
export const CARD_SECRET_TYPE_TEXT_MAP: Record<CardSecretType, string> = {
  time: '按时间',
  count: '按数量',
};

/** 卡密类型 Tag 颜色 */
export const CARD_SECRET_TYPE_COLOR_MAP: Record<CardSecretType, string> = {
  time: 'blue',
  count: 'purple',
};
