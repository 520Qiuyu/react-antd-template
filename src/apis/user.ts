import type {
  GetUserInfoParams,
  UpdateUserInfoParams,
  UserInfoResponseData,
} from '@/types/user';
import { get, put } from 'utils/request';

/** 获取当前登录用户信息 */
export const reqGetSelfUserInfo = () => get<UserInfoResponseData>('/user/info/self');

/** 按用户 ID 或账号获取用户信息 */
export const reqGetUserInfo = (params: GetUserInfoParams) =>
  get<UserInfoResponseData, GetUserInfoParams>('/user/info', params);

/** 更新当前登录用户信息 */
export const reqPutUserInfo = (data: UpdateUserInfoParams) =>
  put<null, UpdateUserInfoParams>('/user/info', data);
