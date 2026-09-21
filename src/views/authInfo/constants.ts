import type { AuthPlatform } from '@/types/authInfo';

/** 认证平台文案 */
export const AUTH_PLATFORM_TEXT_MAP: Record<AuthPlatform, string> = {
  qishui: '汽水音乐',
  netease: '网易云',
};

/** 认证平台颜色 */
export const AUTH_PLATFORM_COLOR_MAP: Record<AuthPlatform, string> = {
  qishui: '#009e68',
  netease: 'red',
};

/** 认证平台筛选项 */
export const AUTH_PLATFORM_OPTIONS = [
  { label: '汽水音乐', value: 'qishui' },
  { label: '网易云', value: 'netease' },
];

/** 账号是否可用筛选项 */
export const AUTH_AVAILABLE_OPTIONS = [
  { label: '可用', value: true },
  { label: '不可用', value: false },
];

/** 批量校验间隔，避免对平台接口调用过快 */
export const VALIDATE_BATCH_INTERVAL_MS = 200;
