/** 登录请求参数 */
export interface LoginRequestParams {
  /** 登录账号 */
  account: string;
  /** 登录密码 */
  password: string;
}

/** 登录表单数据 */
export interface LoginFormValues extends LoginRequestParams {
  /** 是否记住登录状态 */
  remember?: boolean;
}

/** 注册请求参数 */
export interface RegisterRequestParams {
  /** 注册账号 */
  account: string;
  /** 注册密码 */
  password: string;
}

/** 注册表单数据 */
export interface RegisterFormValues extends RegisterRequestParams {
  /** 确认密码 */
  confirmPassword: string;
}

/** 登录/注册共用表单数据 */
export type AuthFormValues = LoginFormValues & Partial<RegisterFormValues>;

/** 登录接口响应数据 */
export interface LoginResponseData {
  /** 登录账号 */
  account: string;
  /** 访问令牌 */
  accessToken: string;
}

/** 注册接口响应数据 */
export interface RegisterResponseData {
  /** 用户 ID */
  id: string;
  /** 注册账号 */
  account: string;
  /** 加密后的密码 */
  password: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}
