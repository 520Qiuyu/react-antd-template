/** 黑名单来源 */
export type BlacklistSource = 'manual' | 'rate_limit';

/** 黑名单记录状态（软删除） */
export type BlacklistStatus = 'active' | 'disabled' | 'unblocked';

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
  /** 状态。active 启用，unblocked 停用 */
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

/** 新建弹窗预填，不带 id，避免被当成编辑 */
export interface BlacklistFormPreset {
  ip?: string;
  reason?: string;
  remark?: string;
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

/** 提交给后端的创建 / 更新参数 */
export interface BlacklistSaveParams {
  ip: string;
  /** ISO；null 表示永久 */
  expireAt: string | null;
  reason: string;
  remark?: string | null;
}

/** 列表查询参数 */
export interface ListBlacklistParams extends PaginationParams {
  keyword?: string;
  source?: BlacklistSource | string;
  status?: BlacklistStatus | string;
  startTime?: string;
  endTime?: string;
}

/** 列表响应 */
export interface BlacklistListData {
  list: BlacklistListItem[];
  total: number;
  pageNum: number;
  pageSize: number;
  /** 全库生效中条数 */
  activeCount: number;
  /** 当前页手动拉黑条数 */
  pageManualCount: number;
  /** 当前页自动拉黑条数 */
  pageAutoCount: number;
}
