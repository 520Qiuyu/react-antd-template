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

/** 用户列表项 */
export interface UserListItem {
  id: string;
  account: string;
  nickname?: string | null;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  wechat?: string | null;
  qq?: string | null;
  gender?: UserGender | null;
  birthday?: string | Date | null;
  status: UserStatus;
  ctime: string;
  utime: string;
}

/** 用户列表查询参数 */
export interface ListUserParams extends PaginationParams {
  keyword?: string;
  status?: Exclude<UserStatus, 'deleted'>;
}

/** 用户列表分页数据 */
export interface UserListData extends PaginationData<UserListItem> {}

/** 更新用户状态参数 */
export interface UpdateUserStatusParams {
  status: Exclude<UserStatus, 'deleted'>;
}

/** 创建用户参数 */
export interface CreateUserParams {
  account: string;
  password: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  qq?: string;
  gender?: UserGender;
  birthday?: string;
  status?: Exclude<UserStatus, 'deleted'>;
}

/** 批量导入用户项 */
export interface ImportUserItem extends Omit<CreateUserParams, 'password'> {
  id?: string;
  password?: string;
  ctime?: string;
  utime?: string;
}

/** 管理员更新用户参数 */
export interface AdminUpdateUserParams {
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  qq?: string;
  gender?: UserGender;
  birthday?: string;
  status?: Exclude<UserStatus, 'deleted'>;
  password?: string;
}
