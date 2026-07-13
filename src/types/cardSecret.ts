/** 卡密类型：按时间 / 按数量 */
export type CardSecretType = 'time' | 'count';

/** 卡密认证信息 */
export interface CardSecretAuthInfo {
  deviceId?: string;
  cookie?: string;
  xHelios?: string;
  xMedusa?: string;
}

/** 卡密列表项 */
export interface CardSecretListItem {
  id: string;
  /** 卡号 */
  cardNo: string;
  /** 类型 */
  type: CardSecretType;
  /** 过期时间 / 结束时间 */
  expireTime?: string | null;
  /** 已解析数量 */
  parsedCount: number;
  /** 未解析 / 可解析数量 */
  unparsedCount: number;
  /** 创建时间 */
  ctime: string;
  /** 更新时间 */
  utime: string;
  /** 认证信息 */
  authInfo?: CardSecretAuthInfo;
}

/** 新建 / 编辑表单参数 */
export interface CardSecretFormValues {
  /** 创建数量（仅新建） */
  createCount?: number;
  type: CardSecretType;
  /** 结束时间（按时间） */
  expireTime?: string | null;
  /** 可解析数量（按数量） */
  parseLimit?: number;
  authInfo?: CardSecretAuthInfo;
}
