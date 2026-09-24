import type { BlacklistListData, BlacklistListItem, BlacklistSaveParams, ListBlacklistParams } from '@/types/blacklist';
import { get, post, put } from 'utils/request';

/**
 * 获取黑名单分页列表
 * @example
 * ```ts
 * reqListIpBlacklist({ pageNum: 1, pageSize: 10, status: 'active' })
 * ```
 */
export const reqListIpBlacklist = (params?: ListBlacklistParams) =>
  get<BlacklistListData>('/ip-blacklist', params);

/**
 * 获取黑名单详情
 * @example
 * ```ts
 * reqGetIpBlacklistById('uuid')
 * ```
 */
export const reqGetIpBlacklistById = (id: string) =>
  get<BlacklistListItem>(`/ip-blacklist/${id}`);

/**
 * 按 IP 获取最近一条拉黑记录，没有记录时 data 为 null
 * @example
 * ```ts
 * reqGetLatestIpBlacklist('1.1.1.1')
 * ```
 */
export const reqGetLatestIpBlacklist = (ip: string) =>
  get<BlacklistListItem | null>('/ip-blacklist/latest', { ip });

/**
 * 新增手动拉黑
 * @example
 * ```ts
 * reqCreateIpBlacklist({ ip: '1.1.1.1', expireAt: null, reason: '恶意请求' })
 * ```
 */
export const reqCreateIpBlacklist = (data: BlacklistSaveParams) =>
  post<BlacklistListItem, BlacklistSaveParams>('/ip-blacklist', data);

/**
 * 更新黑名单
 * @example
 * ```ts
 * reqUpdateIpBlacklist('uuid', { ip: '1.1.1.1', expireAt: null, reason: '更新原因' })
 * ```
 */
export const reqUpdateIpBlacklist = (id: string, data: BlacklistSaveParams) =>
  put<BlacklistListItem, BlacklistSaveParams>(`/ip-blacklist/${id}`, data);

/**
 * 解除拉黑
 * @example
 * ```ts
 * reqUnblockIpBlacklist('uuid')
 * ```
 */
export const reqUnblockIpBlacklist = (id: string) =>
  post<BlacklistListItem>(`/ip-blacklist/${id}/unblock`);

/**
 * 读取黑名单拦截开关
 * @example
 * ```ts
 * reqGetIpBlacklistEnabled() // { enabled: true }
 * ```
 */
export const reqGetIpBlacklistEnabled = () =>
  get<{ enabled: boolean }>('/ip-blacklist/enabled');

/**
 * 更新黑名单拦截开关
 * @example
 * ```ts
 * reqUpdateIpBlacklistEnabled(false)
 * ```
 */
export const reqUpdateIpBlacklistEnabled = (enabled: boolean) =>
  put<{ enabled: boolean }, { enabled: boolean }>('/ip-blacklist/enabled', { enabled });

/**
 * 更新单条黑名单是否启用
 * @example
 * ```ts
 * reqSetIpBlacklistRecordEnabled('uuid', false)
 * ```
 */
export const reqSetIpBlacklistRecordEnabled = (id: string, enabled: boolean) =>
  put<BlacklistListItem, { enabled: boolean }>(`/ip-blacklist/${id}/enabled`, { enabled });
