/** 卡密类型：按时间 / 按数量 */
export type CardSecretType = 'time' | 'count';

/** 卡密状态 */
export type CardSecretStatus = 'normal' | 'disabled';

/** 卡密认证信息 */
export interface CardSecretAuthInfo {
  deviceId: string;
  cookie: string;
  xHelios: string;
  xMedusa: string;
}

/** 根据卡密查询详情（链接解析侧） */
export interface CardSecretDetail {
  id: string;
  /** 卡密 */
  secret: string;
  /** 类型：按时间 / 按数量 */
  type: CardSecretType;
  /** 过期时间（按时间） */
  expireTime?: string | null;
  /** 启用时间（首次成功解析后写入） */
  enableTime?: string | null;
  /** 有效期（天） */
  validDays?: number | null;
  /** 可解析数量（按数量） */
  parseLimit: number;
  /** 已解析数量 */
  parsedCount: number;
  /** 每日最多解析数量（按时长；为空不限制） */
  dailyParseLimit?: number | null;
  /** 当日已解析数量 */
  dailyParsedCount?: number;
  /** 状态 */
  status: CardSecretStatus | string;
  /** 备注 */
  remark?: string | null;
}

/** 卡密列表查询参数 */
export interface ListCardSecretParams {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  type?: CardSecretType;
  status?: CardSecretStatus;
  /** 创建者 ID（逗号分隔多选，仅管理员可用） */
  createUserId?: string;
}

/** 卡密列表项 */
export interface CardSecretListItem {
  id: string;
  /** 卡密 / 卡号 */
  secret: string;
  /** 兼容字段，与 secret 相同 */
  cardNo?: string;
  /** 类型 */
  type: CardSecretType;
  /** 过期时间 / 结束时间 */
  expireTime?: string | null;
  /** 启用时间（首次成功解析后写入） */
  enableTime?: string | null;
  /** 有效期（天） */
  validDays?: number | null;
  /** 可解析数量 */
  parseLimit: number;
  /** 已解析数量 */
  parsedCount: number;
  /** 未解析 / 剩余可解析数量 */
  unparsedCount: number;
  /** 每日最多解析数量（按时长；为空不限制） */
  dailyParseLimit?: number | null;
  /** 当日已解析数量 */
  dailyParsedCount?: number;
  /** 当日计数对应日期 */
  dailyParseDate?: string | null;
  /** 认证信息 ID */
  authInfoId?: string | null;
  /** 认证信息 */
  authInfo?: CardSecretAuthInfo | null;
  /** 状态 */
  status: CardSecretStatus | string;
  /** 备注 */
  remark?: string | null;
  /** 创建者 */
  createUser?: { account: string; nickname: string | null } | null;
  /** 创建时间 */
  ctime: string;
  /** 更新时间 */
  utime: string;
}

/** 卡密列表响应附加统计 */
export interface CardSecretListStats {
  unusedCount: number;
  usedCount: number;
  todayCount: number;
  yesterdayCount: number;
}

/** 新建卡密参数 */
export interface CreateCardSecretParams {
  /** 创建数量 */
  createCount?: number;
  type: CardSecretType;
  /** 结束时间（按时间） */
  expireTime?: string | null;
  /** 启用时间（按时长；留空则首次成功解析时写入） */
  enableTime?: string | null;
  /** 有效期天数（按时长） */
  validDays?: number | null;
  /** 可解析数量（按数量） */
  parseLimit?: number;
  /** 每日最多解析数量（按时长；null 表示不限制） */
  dailyParseLimit?: number | null;
  authInfo?: CardSecretAuthInfo;
  remark?: string;
  status?: CardSecretStatus;
}

/** 更新卡密参数 */
export interface UpdateCardSecretParams {
  type?: CardSecretType;
  expireTime?: string | null;
  enableTime?: string | null;
  validDays?: number | null;
  parseLimit?: number;
  /** 每日最多解析数量（按时长；null 表示不限制） */
  dailyParseLimit?: number | null;
  authInfo?: CardSecretAuthInfo | null;
  remark?: string | null;
  status?: CardSecretStatus;
}

/** 更新卡密状态参数 */
export interface UpdateCardSecretStatusParams {
  status: CardSecretStatus;
}

/** 新建 / 编辑表单参数 */
export interface CardSecretFormValues {
  /** 创建数量（仅新建） */
  createCount?: number;
  type: CardSecretType;
  /** 结束时间（按时间） */
  expireTime?: string | null;
  /** 启用时间（按时长） */
  enableTime?: string | null;
  /** 有效期天数（按时长） */
  validDays?: number | null;
  /** 可解析数量（按数量） */
  parseLimit?: number;
  /** 每日最多解析数量（按时长；null 表示不限制） */
  dailyParseLimit?: number | null;
  authInfo?: CardSecretAuthInfo;
}
