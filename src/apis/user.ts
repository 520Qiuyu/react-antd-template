import type {
  AdminUpdateUserParams,
  CreateUserParams,
  GetUserInfoParams,
  ImportUserItem,
  ListUserParams,
  UpdateUserInfoParams,
  UpdateUserStatusParams,
  UserInfoResponseData,
  UserListData,
} from '@/types/user';
import type { BatchImportResult, IApiResponse } from '@/types/request';
import { del, get, post, put } from 'utils/request';

/** 获取当前登录用户信息 */
export const reqGetSelfUserInfo = () => get<UserInfoResponseData>('/user/info/self');

/** 按用户 ID 或账号获取用户信息 */
export const reqGetUserInfo = (params: GetUserInfoParams) =>
  get<UserInfoResponseData>('/user/info', params);

/** 更新当前登录用户信息 */
export const reqPutUserInfo = (data: UpdateUserInfoParams) =>
  put<null>('/user/info', data);

/** 获取用户列表 */
export const reqListUsers = (params?: ListUserParams) =>
  get<UserListData>('/user', params);

/** 获取用户详情 */
export const reqGetUserById = (id: string) => get<UserInfoResponseData>(`/user/${id}`);

/** 创建用户 */
export const reqCreateUser = (data: CreateUserParams) =>
  post<UserInfoResponseData>('/user', data);

/** 更新用户 */
export const reqUpdateUser = (id: string, data: AdminUpdateUserParams) =>
  put<UserInfoResponseData>(`/user/${id}`, data);

/** 删除用户 */
export const reqDeleteUser = (id: string) => del<null>(`/user/${id}`);

/** 更新用户状态 */
export const reqUpdateUserStatus = (id: string, data: UpdateUserStatusParams) =>
  put<null>(`/user/${id}/status`, data);

/** 批量导入用户 */
export const reqImportUsers = (list: ImportUserItem[]) =>
  post<BatchImportResult, { list: ImportUserItem[] }>('/user/import/batch', { list });
