import type {
  AdminUpdateUserParams,
  CreateUserParams,
  GetUserInfoParams,
  ListUserParams,
  UpdateUserInfoParams,
  UpdateUserStatusParams,
  UserInfoResponseData,
  UserListData,
} from '@/types/user';
import { del, get, post, put } from 'utils/request';

/** 获取当前登录用户信息 */
export const reqGetSelfUserInfo = () => get<UserInfoResponseData>('/user/info/self');

/** 按用户 ID 或账号获取用户信息 */
export const reqGetUserInfo = (params: GetUserInfoParams) =>
  get<UserInfoResponseData, GetUserInfoParams>('/user/info', params);

/** 更新当前登录用户信息 */
export const reqPutUserInfo = (data: UpdateUserInfoParams) =>
  put<null, UpdateUserInfoParams>('/user/info', data);

/** 获取用户列表 */
export const reqListUsers = (params?: ListUserParams) =>
  get<UserListData, ListUserParams>('/user', params);

/** 获取用户详情 */
export const reqGetUserById = (id: string) => get<UserInfoResponseData>(`/user/${id}`);

/** 创建用户 */
export const reqCreateUser = (data: CreateUserParams) =>
  post<UserInfoResponseData, CreateUserParams>('/user', data);

/** 更新用户 */
export const reqUpdateUser = (id: string, data: AdminUpdateUserParams) =>
  put<UserInfoResponseData, AdminUpdateUserParams>(`/user/${id}`, data);

/** 删除用户 */
export const reqDeleteUser = (id: string) => del<null>(`/user/${id}`);

/** 更新用户状态 */
export const reqUpdateUserStatus = (id: string, data: UpdateUserStatusParams) =>
  put<null, UpdateUserStatusParams>(`/user/${id}/status`, data);
