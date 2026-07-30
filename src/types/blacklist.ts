/** 黑名单来源 */
export type BlacklistSource = 'manual' | 'rate_limit';

/** 黑名单记录状态（软删除） */
export type BlacklistStatus = 'active' | 'unblocked';

/** 拉黑时长选项 */
export type BlacklistDuration = '1h' | '24h' | '7d' | '30d' | 'permanent' | 'custom';

/** 过期状态（计算字段） */
export type BlacklistExpireStatus = 'permanent' | 'valid' | 'expired';

/** 黑名单列表项 */
export interface BlacklistListItem {
  id: string;
  /** IP 地址 */
  ip: string;
  /** 来源 */
  source: BlacklistSource;
  /** 状态 */
  status: BlacklistStatus;
  /** 过期时间；null 表示永久 */
  expireAt: string | null;
  /** 拉黑原因 */
  reason: string;
  /** 备注 */
  remark?: string;
  /** 创建人 */
  createdBy: string;
  /** 创建时间 */
  ctime: string;
  /** 更新时间 */
  utime: string;
  /** 解除时间 */
  unblockedAt?: string | null;
  /** 解除人 */
  unblockedBy?: string | null;
}

/** 新建 / 编辑表单参数 */
export interface BlacklistFormValues {
  ip: string;
  duration: BlacklistDuration;
  /** duration === custom 时的过期时间（ISO） */
  customExpireAt?: string;
  reason: string;
  remark?: string;
}
