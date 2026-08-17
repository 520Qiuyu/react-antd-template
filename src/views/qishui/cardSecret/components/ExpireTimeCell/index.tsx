import type { CardSecretListItem } from '@/types/cardSecret';
import classNames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.less';
import { cardSecretIsEnabled, getValidDaysExpireAt } from '../../utils/cardSecretTime';

/**
 * 卡密过期时间单元格：剩余时间为主，日期为辅，附寿命进度
 * @example
 * ```tsx
 * <ExpireTimeCell record={record} />
 * ```
 */
const ExpireTimeCell: React.FC<Props> = ({ record }) => {
  const { validDays, expireTime, ctime, enableTime, type } = record;
  /** 是否是数量卡 */
  const isCount = type === 'count';
  /** 是否是时间卡 */
  const isTime = type === 'time';
  /** 是否配置了有效天数 */
  const hasConfiguredValidDays = isTime && validDays != null && validDays > 0;
  /** 是否启用 */
  const isEnabled = cardSecretIsEnabled(record);
  // 未启用
  if (!isEnabled) {
    return <span className={styles['unlimited']}>未启用</span>;
  }
  // 没有配置有效天数且没有过期时间
  if (isCount || (isTime && !hasConfiguredValidDays && !expireTime)) {
    return <span className={styles['unlimited']}>不限期</span>;
  }

  const now = dayjs();
  /** 启用时间 */
  const enableAt = hasConfiguredValidDays ? dayjs(enableTime) : dayjs(ctime);
  /** 过期时间 */
  const expireAt = hasConfiguredValidDays
    ? getValidDaysExpireAt(enableTime, validDays)!
    : dayjs(expireTime);
  if (!expireAt.isValid()) {
    return <span className={styles['unlimited']}>-</span>;
  }
  /** 是否已过期 */
  const isExpired = !expireAt.isAfter(now);
  /** 剩余毫秒 */
  const msRemain = expireAt.diff(now);
  /** 剩余小时 */
  const hoursRemain = expireAt.diff(now, 'hour');
  /** 剩余天数（向上取整） */
  const daysRemainCeil = Math.ceil(expireAt.diff(now, 'day', true));
  /** 已过期天数（向上取整） */
  const daysExpiredCeil = Math.ceil(now.diff(expireAt, 'day', true));

  let primaryText = '';
  let tone: 'normal' | 'warn' | 'danger' = 'normal';
  let expiredHint: string | null = null;

  if (isExpired) {
    primaryText = '已过期';
    tone = 'danger';
    if (daysExpiredCeil >= 1) {
      expiredHint = `过期 ${daysExpiredCeil} 天`;
    }
  } else if (msRemain < 60 * 60 * 1000) {
    primaryText = '不到 1 小时';
    tone = 'warn';
  } else if (hoursRemain < 24) {
    primaryText = `剩 ${Math.max(1, hoursRemain)} 小时`;
    tone = 'warn';
  } else {
    primaryText = `剩 ${daysRemainCeil} 天`;
    tone = daysRemainCeil <= 7 ? 'warn' : 'normal';
  }

  let lifePercent: number | null = null;
  if (enableAt?.isValid() && expireAt.isAfter(enableAt)) {
    const totalMs = expireAt.diff(enableAt);
    const elapsedMs = now.diff(enableAt);
    lifePercent = isExpired
      ? 100
      : Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 1000) / 10));
  }

  const dateText = expireAt.format('YYYY-MM-DD HH:mm:ss');
  const secondaryText = isExpired ? `过期于 ${dateText}` : dateText;
  const barWarn = tone === 'warn' || (lifePercent !== null && lifePercent >= 90);

  return (
    <div
      className={styles['cell']}
      aria-label={
        isExpired
          ? `已过期，过期时间 ${dateText}`
          : `剩余有效期 ${primaryText}，过期时间 ${dateText}`
      }>
      <div className={styles['primary']}>
        <strong
          className={classNames({
            [styles['warn']]: tone === 'warn',
            [styles['danger']]: tone === 'danger',
          })}>
          {primaryText}
        </strong>
        {expiredHint ? <em>{expiredHint}</em> : null}
      </div>
      <div className={styles['date']}>{secondaryText}</div>
      {lifePercent !== null ? (
        <div
          className={styles['track']}
          role='progressbar'
          aria-valuenow={lifePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label='卡密寿命进度'>
          <div
            className={classNames(styles['fill'], {
              [styles['fillWarn']]: barWarn && tone !== 'danger',
              [styles['fillDanger']]: tone === 'danger',
            })}
            style={{ width: `${lifePercent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ExpireTimeCell;

interface Props {
  record: CardSecretListItem;
}
