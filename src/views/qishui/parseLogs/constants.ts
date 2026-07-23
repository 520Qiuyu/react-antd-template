import type { ParseLogStatus, ParseLogType } from '@/types/parseLog';

/** 解析类型文案 */
export const PARSE_LOG_TYPE_TEXT_MAP: Record<ParseLogType, string> = {
  song: '单曲',
  playlist: '歌单',
};

/** 解析类型颜色 */
export const PARSE_LOG_TYPE_COLOR_MAP: Record<ParseLogType, string> = {
  song: 'blue',
  playlist: 'purple',
};

/** 解析类型筛选项 */
export const PARSE_LOG_TYPE_OPTIONS = [
  { label: '单曲', value: 'song' },
  { label: '歌单', value: 'playlist' },
];

/** 解析状态文案 */
export const PARSE_LOG_STATUS_TEXT_MAP: Record<ParseLogStatus, string> = {
  success: '成功',
  fail: '失败',
};

/** 解析状态颜色 */
export const PARSE_LOG_STATUS_COLOR_MAP: Record<ParseLogStatus, string> = {
  success: 'success',
  fail: 'error',
};

/** 解析状态筛选项 */
export const PARSE_LOG_STATUS_OPTIONS = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'fail' },
];
