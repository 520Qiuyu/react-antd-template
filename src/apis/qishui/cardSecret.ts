import type { Drop } from '@/hooks/useGetDrop';
import type {
  CardSecretDetail,
  CardSecretListItem,
  CardSecretListStats,
  CreateCardSecretParams,
  ListCardSecretParams,
  UpdateCardSecretParams,
  UpdateCardSecretStatusParams,
} from '@/types/cardSecret';
import type { IPageData } from '@/types/request';
import { del, get, post, put } from 'utils/request';

/**
 * 根据卡密获取详情（链接解析侧）
 * @example
 * ```ts
 * const res = await reqGetCardSecretBySecret('XXXX-XXXX');
 * ```
 */
export const reqGetCardSecretBySecret = (secret: string) =>
  get<CardSecretDetail>(`/qishui/card-secret/secret/${encodeURIComponent(secret.trim())}`);

/**
 * 获取卡密列表 创建者下拉
 * @example
 * ```ts
 * const res = await reqGetCreateUserOptions();
 * ```
 */
export const reqGetCreateUserOptions = () =>
  get<(Drop & { nickname: string | null })[]>(`/qishui/card-secret/create-user-options`);

/**
 * 获取卡密列表
 * @example
 * ```ts
 * const res = await reqListCardSecrets({ pageNum: 1, pageSize: 10 });
 * ```
 */
export const reqListCardSecrets = (params?: ListCardSecretParams) =>
  get<IPageData<CardSecretListItem> & CardSecretListStats>('/qishui/card-secret', params);

/**
 * 获取卡密详情
 * @example
 * ```ts
 * const res = await reqGetCardSecretById('uuid');
 * ```
 */
export const reqGetCardSecretById = (id: string) =>
  get<CardSecretListItem>(`/qishui/card-secret/${id}`);

/**
 * 创建卡密
 * @example
 * ```ts
 * const res = await reqCreateCardSecret({ type: 'time', validDays: 30, createCount: 5 });
 * ```
 */
export const reqCreateCardSecret = (data: CreateCardSecretParams) =>
  post<{ list: CardSecretListItem[]; count: number }>('/qishui/card-secret', data);

/**
 * 更新卡密
 * @example
 * ```ts
 * const res = await reqUpdateCardSecret(id, { type: 'count', parseLimit: 100 });
 * ```
 */
export const reqUpdateCardSecret = (id: string, data: UpdateCardSecretParams) =>
  put<CardSecretListItem>(`/qishui/card-secret/${id}`, data);

/**
 * 更新卡密状态
 * @example
 * ```ts
 * const res = await reqUpdateCardSecretStatus(id, { status: 'disabled' });
 * ```
 */
export const reqUpdateCardSecretStatus = (id: string, data: UpdateCardSecretStatusParams) =>
  put<CardSecretListItem>(`/qishui/card-secret/${id}/status`, data);

/**
 * 重置当日解析次数
 * @example
 * ```ts
 * const res = await reqResetParseCount(id);
 * ```
 */
export const reqResetParseCount = (id: string) =>
  put<CardSecretListItem>(`/qishui/card-secret/${id}/reset-daily-parse-count`);

/**
 * 删除卡密
 * @example
 * ```ts
 * const res = await reqDeleteCardSecret(id);
 * ```
 */
export const reqDeleteCardSecret = (id: string) => del<{ id: string }>(`/qishui/card-secret/${id}`);
