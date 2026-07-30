import type {
  BlacklistDuration,
  BlacklistExpireStatus,
  BlacklistListItem,
  BlacklistSource,
  BlacklistStatus,
} from '@/types/blacklist';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const IPV4_REGEXP =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;

/**
 * 校验是否为合法 IPv4
 * @example
 * ```ts
 * isValidIpv4('192.168.1.1') // true
 * isValidIpv4('999.1.1.1') // false
 * ```
 */
export const isValidIpv4 = (ip: string) => IPV4_REGEXP.test(ip.trim());

/**
 * 计算过期状态
 * @example
 * ```ts
 * getExpireStatus(null) // 'permanent'
 * getExpireStatus('2099-01-01T00:00:00.000Z') // 'valid'
 * ```
 */
export const getExpireStatus = (
  expireAt: string | null,
  now: Dayjs = dayjs(),
): BlacklistExpireStatus => {
  if (!expireAt) return 'permanent';
  return dayjs(expireAt).isAfter(now) ? 'valid' : 'expired';
};

/**
 * 根据时长选项计算 expireAt
 * @example
 * ```ts
 * resolveExpireAt('permanent') // null
 * resolveExpireAt('1h') // ISO string ~1 hour later
 * resolveExpireAt('custom', '2099-01-01T00:00:00.000Z')
 * ```
 */
export const resolveExpireAt = (
  duration: BlacklistDuration,
  customExpireAt?: string,
  now: Dayjs = dayjs(),
): string | null => {
  if (duration === 'permanent') return null;
  if (duration === 'custom') return customExpireAt ? dayjs(customExpireAt).toISOString() : null;

  const unitMap: Record<Exclude<BlacklistDuration, 'permanent' | 'custom'>, [number, dayjs.ManipulateType]> =
    {
      '1h': [1, 'hour'],
      '24h': [24, 'hour'],
      '7d': [7, 'day'],
      '30d': [30, 'day'],
    };
  const [amount, unit] = unitMap[duration];
  return now.add(amount, unit).toISOString();
};

export interface BlacklistFilterParams {
  keyword?: string;
  source?: BlacklistSource | string;
  status?: BlacklistStatus | string;
  dateRange?: [Dayjs, Dayjs] | [string, string] | null;
}

/**
 * 按筛选条件过滤黑名单列表
 * @example
 * ```ts
 * filterBlacklistList(list, { status: 'active', keyword: '1.1.1' })
 * ```
 */
export const filterBlacklistList = (
  list: BlacklistListItem[],
  params: BlacklistFilterParams,
): BlacklistListItem[] => {
  const keyword = params.keyword?.trim().toLowerCase();
  const [start, end] = params.dateRange || [];

  return list.filter((item) => {
    if (params.source && item.source !== params.source) return false;
    if (params.status && item.status !== params.status) return false;

    if (start && end) {
      const ctime = dayjs(item.ctime);
      if (ctime.isBefore(dayjs(start).startOf('day')) || ctime.isAfter(dayjs(end).endOf('day'))) {
        return false;
      }
    }

    if (!keyword) return true;

    return (
      item.ip.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword) ||
      (item.remark || '').toLowerCase().includes(keyword)
    );
  });
};
