/** 用户状态 */
export type UserStatus = 'normal' | 'disabled' | 'deleted';

/** 用户性别 */
export type UserGender = 'male' | 'female' | 'unknown';

/** 获取用户信息查询参数 */
export interface GetUserInfoParams {
  /** 用户 ID */
  id?: string;
  /** 登录账号 */
  account?: string;
}

/** 更新用户信息请求参数 */
export interface UpdateUserInfoParams {
  /** 用户昵称 */
  nickname?: string;
  /** 用户头像 */
  avatar?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 微信号 */
  wechat?: string;
  /** QQ 号 */
  qq?: string;
  /** 性别 */
  gender?: UserGender;
  /** 生日，格式为 YYYY-MM-DD */
  birthday?: string;
}

/** 用户信息响应数据 */
export interface UserInfoResponseData {
  /** 用户 ID */
  id: string;
  /** 登录账号 */
  account: string;
  /** 用户昵称 */
  nickname?: string | null;
  /** 用户头像 */
  avatar?: string | null;
  /** 邮箱 */
  email?: string | null;
  /** 手机号 */
  phone?: string | null;
  /** 微信号 */
  wechat?: string | null;
  /** QQ 号 */
  qq?: string | null;
  /** 性别 */
  gender?: UserGender | null;
  /** 生日 */
  birthday?: string | Date | null;
  /** 用户状态 */
  status: UserStatus;
}
