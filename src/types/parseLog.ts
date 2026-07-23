/** 解析日志类型：单曲 / 歌单 */
export type ParseLogType = 'song' | 'playlist';

/** 解析结果状态 */
export type ParseLogStatus = 'success' | 'fail';

/** 解析日志列表查询参数 */
export interface ListParseLogParams {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  type?: ParseLogType | string;
  status?: ParseLogStatus | string;
}

/** 解析日志列表项 */
export interface ParseLogListItem {
  id: string;
  /** 使用的卡密 */
  cardSecret: string;
  /** 解析类型 */
  type: ParseLogType;
  /** 目标名称（歌名 / 歌单名） */
  targetName: string;
  /** 目标 ID */
  targetId: string;
  /** 解析状态 */
  status: ParseLogStatus;
  /** 请求 IP */
  ip: string;
  /** 请求路径 */
  path: string;
  /** 请求方法 */
  method: string;
  /** 操作用户账号（可为空，游客卡密） */
  userAccount?: string | null;
  /** 失败原因 */
  errorMsg?: string | null;
  /** 解析请求参数（JSON 字符串） */
  parseParams?: string | null;
  /** 耗时（毫秒） */
  durationMs: number;
  /** 创建时间 */
  ctime: string;
  /** 更新时间 */
  utime: string;
}

/** 解析日志统计 */
export interface ParseLogListStats {
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failCount: number;
  /** 今日解析次数 */
  todayCount: number;
  /** 昨日解析次数 */
  yesterdayCount: number;
}
