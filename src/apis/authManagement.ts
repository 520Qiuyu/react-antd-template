import type {
  AuthInfoListItem,
  AuthInfoListStats,
  CreateAuthInfoParams,
  ImportAuthInfoItem,
  ListAuthInfoParams,
  UpdateAuthInfoParams,
  UpdateAuthInfoStatusParams,
} from '@/types/authInfo';
import type { BatchImportResult, IPageData } from '@/types/request';import { del, get, post, put } from 'utils/request';

/**
 * 获取认证信息列表
 * @example
 * ```ts
 * const res = await reqListAuthInfos({ pageNum: 1, pageSize: 10 });
 * ```
 */
export const reqListAuthInfos = (params?: ListAuthInfoParams) =>
  get<IPageData<AuthInfoListItem> & AuthInfoListStats>('/auth-management', params);

/**
 * 获取认证信息详情
 * @example
 * ```ts
 * const res = await reqGetAuthInfoById('uuid');
 * ```
 */
export const reqGetAuthInfoById = (id: string) =>
  get<AuthInfoListItem>(`/auth-management/${id}`);

/**
 * 创建认证信息
 * @example
 * ```ts
 * const res = await reqCreateAuthInfo({ platform: 'qishui', authInfo: { name: '主号' } });
 * ```
 */
export const reqCreateAuthInfo = (data: CreateAuthInfoParams) =>
  post<AuthInfoListItem>('/auth-management', data);

/**
 * 更新认证信息
 * @example
 * ```ts
 * const res = await reqUpdateAuthInfo(id, { platform: 'netease', authInfo: { cookie: 'a=1' } });
 * ```
 */
export const reqUpdateAuthInfo = (id: string, data: UpdateAuthInfoParams) =>
  put<AuthInfoListItem>(`/auth-management/${id}`, data);

/**
 * 更新认证信息状态
 * @example
 * ```ts
 * const res = await reqUpdateAuthInfoStatus(id, { status: 'disabled' });
 * ```
 */
export const reqUpdateAuthInfoStatus = (id: string, data: UpdateAuthInfoStatusParams) =>
  put<AuthInfoListItem>(`/auth-management/${id}/status`, data);

/**
 * 删除认证信息
 * @example
 * ```ts
 * const res = await reqDeleteAuthInfo(id);
 * ```
 */
export const reqDeleteAuthInfo = (id: string) => del<{ id: string }>(`/auth-management/${id}`);

/**
 * 批量导入认证信息
 * @example
 * ```ts
 * const res = await reqImportAuthInfos(list);
 * ```
 */
export const reqImportAuthInfos = (list: ImportAuthInfoItem[]) =>
  post<BatchImportResult, { list: ImportAuthInfoItem[] }>('/auth-management/import/batch', {
    list,
  });

/**
 * 校验认证信息是否可用
 * @example
 * ```ts
 * const res = await reqValidateAuthInfo({ id });
 * ```
 */
export const reqValidateAuthInfo = (data: { id: string }) =>
  post<AuthInfoListItem>('/auth-management/validate', data);
