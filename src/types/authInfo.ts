/** 认证平台 */
export type AuthPlatform = 'qishui' | 'netease';

/** 认证信息状态 */
export type AuthInfoStatus = 'normal' | 'disabled';

/** 完整性筛选 */
export type AuthInfoCompleteStatus = 'complete' | 'incomplete';

/** 写入 AuthInfo.authInfo 的 JSON，结构随平台变化 */
export type AuthInfoPayload = Record<string, unknown>;

/** 认证信息列表查询参数 */
export interface ListAuthInfoParams {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  platform?: AuthPlatform | string;
  status?: AuthInfoStatus | string;
  completeStatus?: AuthInfoCompleteStatus;
}

/** 认证信息列表项 */
export interface AuthInfoListItem {
  id: string;
  /** 平台 */
  platform: AuthPlatform | string;
  /** 名称 */
  name: string;
  /** 设备 ID */
  deviceId: string;
  /** Cookie */
  cookie: string;
  /** X-Helios */
  xHelios: string;
  /** X-Medusa */
  xMedusa: string;
  /** 是否可用 */
  isAvailable: boolean;
  /** 状态 */
  status: AuthInfoStatus | string;
  /** 备注 */
  remark?: string | null;
  /** 认证 JSON 是否非空 */
  complete: boolean;
  /** 创建时间 */
  ctime: string;
  /** 更新时间 */
  utime: string;
  /** 原始认证 JSON */
  authInfo: AuthInfoPayload;
}

/** 认证信息列表响应附加统计 */
export interface AuthInfoListStats {
  availableCount: number;
  unavailableCount: number;
  todayCount: number;
  yesterdayCount: number;
}

/** 新建认证信息参数 */
export interface CreateAuthInfoParams {
  platform: AuthPlatform;
  authInfo: AuthInfoPayload;
  isAvailable?: boolean;
  status?: AuthInfoStatus;
  remark?: string;
}

/** 更新认证信息参数 */
export interface UpdateAuthInfoParams {
  platform?: AuthPlatform;
  authInfo?: AuthInfoPayload;
  isAvailable?: boolean;
  status?: AuthInfoStatus;
  remark?: string | null;
}

/** 更新认证信息状态参数 */
export interface UpdateAuthInfoStatusParams {
  status: AuthInfoStatus;
}

/** 新建 / 编辑表单参数 */
export interface AuthInfoFormValues {
  platform: AuthPlatform;
  name: string;
  /** 认证 JSON 文本 */
  authInfoText: string;
  remark?: string;
}
