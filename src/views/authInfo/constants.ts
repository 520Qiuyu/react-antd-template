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

/** 完整性筛选项 */
export const AUTH_COMPLETE_OPTIONS = [
  { label: '完整', value: 'complete' },
  { label: '不完整', value: 'incomplete' },
];
