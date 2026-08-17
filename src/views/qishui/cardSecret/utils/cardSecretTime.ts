import type { CardSecretListItem } from '@/types/cardSecret';
import dayjs, { type Dayjs } from 'dayjs';

/**
 * 由启用时间 + 有效期天数计算到期时间，与 expireTime 相互独立
 * @example
 * ```ts
 * getValidDaysExpireAt('2026-08-17T12:00:00', 30);
 * ```
 */
export const getValidDaysExpireAt = (
  enableTime?: string | null,
  validDays?: number | null,
): Dayjs | null => {
  if (!enableTime || validDays == null || validDays <= 0) {
    return null;
  }
  const start = dayjs(enableTime);
  if (!start.isValid()) {
    return null;
  }
  return start.add(validDays, 'day');
};

/**
 * 旧数据有效期天数：expireTime - ctime
 * @example
 * ```ts
 * getLegacyValidDays('2026-08-01T12:00:00', '2026-08-31T12:00:00'); // 30
 * ```
 */
export const getLegacyValidDays = (ctime?: string | null, expireTime?: string | null) => {
  if (!ctime || !expireTime) {
    return null;
  }
  const start = dayjs(ctime);
  const end = dayjs(expireTime);
  if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
    return null;
  }
  return Math.max(1, Math.round(end.diff(start, 'day', true)));
};

/**
 * 判断卡密是否启用
 * @example
 * ```ts
 * isEnabled('2026-08-01T12:00:00', '2026-08-31T12:00:00'); // true
 * ```
 */
export const cardSecretIsEnabled = (record: CardSecretListItem) => {
  const { enableTime, validDays, type } = record;
  /** 是否是数量卡 */
  const isCount = type === 'count';
  /** 是否是时间卡 */
  const isTime = type === 'time';
  /** 是否配置了有效天数 */
  const hasConfiguredValidDays = validDays != null && validDays > 0;

  if (enableTime) return true;
  if (isCount) return !!enableTime;
  if (isTime) {
    if (hasConfiguredValidDays) return !!enableTime;
    return true;
  }
  return true;
};

/**
 * 获取卡密首次使用时间
 * @example
 * ```ts
 * getCardSecretFirstUseTime({ enableTime: '2026-08-01T12:00:00', type: 'time', validDays: 30 }); // '2026-08-01T12:00:00'
 * getCardSecretFirstUseTime({ ctime: '2026-08-01T12:00:00', type: 'count' }); // null
 * getCardSecretFirstUseTime({ ctime: '2026-08-01T12:00:00', type: 'time', validDays: 0 }); // '2026-08-01T12:00:00'
 * getCardSecretFirstUseTime({ ctime: '2026-08-01T12:00:00', type: 'time', validDays: 30 }); // '2026-08-01T12:00:00'
 * getCardSecretFirstUseTime({ ctime: '2026-08-01T12:00:00', type: 'time', validDays: 30 }); // '2026-08-01T12:00:00'
 * ```
 */
export const getCardSecretFirstUseTime = (record: CardSecretListItem) => {
  const { enableTime, validDays, type, ctime } = record;
  /** 是否是数量卡 */
  const isCount = type === 'count';
  /** 是否是时间卡 */
  const isTime = type === 'time';
  /** 是否配置了有效天数 */
  const hasConfiguredValidDays = isTime && validDays != null && validDays > 0;

  /** 首次使用时间 */
  if (enableTime) return dayjs(enableTime);
  if (isCount) return null;
  // 老版本数量卡，已创建时间算首次使用时间
  if (isTime && !hasConfiguredValidDays) return dayjs(ctime);

  return dayjs(ctime);
};

/**
 * 获取卡密有效期天数
 * @example
 * ```ts
 * getCardSecretValidDays({ validDays: 30, type: 'time' }); // 30
 * getCardSecretValidDays({ validDays: 0, type: 'time' }); // null
 * getCardSecretValidDays({ validDays: 30, type: 'count' }); // 30
 * getCardSecretValidDays({ validDays: 30, type: 'time' }); // 30
 * ```
 */
export const getCardSecretValidDays = (record: CardSecretListItem) => {
  const { validDays, type, expireTime, ctime } = record;
  /** 是否是数量卡 */
  const isCount = type === 'count';
  /** 是否是时间卡 */
  const isTime = type === 'time';
  /** 是否配置了有效天数 */
  const hasConfiguredValidDays = isTime && validDays != null && validDays > 0;
  if (isCount) return '不限时间';
  if (isTime) {
    if (hasConfiguredValidDays) return validDays;
    return getLegacyValidDays(ctime, expireTime!);
  }
};
