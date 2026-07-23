import type {
  ListParseLogParams,
  ParseLogListItem,
  ParseLogListStats,
} from '@/types/parseLog';
import type { IPageData } from '@/types/request';
import { del, get } from 'utils/request';

/**
 * 获取解析日志列表
 * @example
 * ```ts
 * const res = await reqListParseLogs({ pageNum: 1, pageSize: 10 });
 * ```
 */
export const reqListParseLogs = (params?: ListParseLogParams) =>
  get<IPageData<ParseLogListItem> & ParseLogListStats>('/qishui/logs', params);

/**
 * 获取解析日志详情
 * @example
 * ```ts
 * const res = await reqGetParseLogById('uuid');
 * ```
 */
export const reqGetParseLogById = (id: string) =>
  get<ParseLogListItem>(`/qishui/logs/${id}`);

/**
 * 删除解析日志
 * @example
 * ```ts
 * const res = await reqDeleteParseLog(id);
 * ```
 */
export const reqDeleteParseLog = (id: string) =>
  del<{ id: string }>(`/qishui/logs/${id}`);
