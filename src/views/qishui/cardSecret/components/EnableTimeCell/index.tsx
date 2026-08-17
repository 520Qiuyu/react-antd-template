import type { CardSecretListItem } from '@/types/cardSecret';
import classNames from 'classnames';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import {
  cardSecretIsEnabled,
  getCardSecretFirstUseTime,
  getCardSecretValidDays,
  getLegacyValidDays,
  getValidDaysExpireAt,
} from '../../utils/cardSecretTime';
import styles from './index.module.less';

/**
 * 卡密启用时间单元格：休眠 / 点燃双态，已启用后展示历时与有效期进度
 * @example
 * ```tsx
 * <EnableTimeCell record={record} />
 * ```
 */
const EnableTimeCell: React.FC<Props> = ({ record }) => {
  const { validDays, enableTime, ctime, expireTime, type } = record;
  /** 是否是数量卡 */
  const isCount = type === 'count';
  /** 是否是时间卡 */
  const isTime = type === 'time';
  /** 是否配置了有效天数 新字段 */
  const hasConfiguredValidDays = isTime && validDays != null && validDays > 0;
  // 有有效天数的情况下启用时间使用 enableTime
  // 否则是旧版数据，默认创建即启用，使用创建时间 ctime
  /** 是否已启用 */
  const isEnabled = cardSecretIsEnabled(record);
  /** 启用时间 */
  const enableAt = getCardSecretFirstUseTime(record);
  // 有有效天数用 validDays；旧数据用 expireTime - ctime
  const effectiveValidDays = getCardSecretValidDays(record);

  // 未启用
  if (!isEnabled) {
    return (
      <div className={classNames(styles['cell'], styles['isDormant'])}>
        <div className={styles['primary']}>
          <i className={styles['led']} aria-hidden='true' />
          <strong>未启用</strong>
        </div>
        {/* 时间卡计算有效期 */}
        {isTime && (
          <div className={styles['date']}>
            {effectiveValidDays != null ? (
              <>
                有效期 <b>{effectiveValidDays}</b> 天
              </>
            ) : (
              '首次解析后起算'
            )}
          </div>
        )}
        <div className={styles['track']} aria-hidden='true'>
          <div className={styles['dash']} />
        </div>
      </div>
    );
  }

  /** 现在时间 */
  const now = dayjs();
  /** 过期时间 */
  const validExpireAt = hasConfiguredValidDays
    ? getValidDaysExpireAt(enableTime, validDays)
    : dayjs(expireTime);
  /** 有效期已用尽 */
  const isOver = Boolean(validExpireAt && !validExpireAt.isAfter(now));
  /** 已启用时长 */
  const hoursElapsed = now.diff(enableAt, 'hour');
  /** 已启用天数（向上取整） */
  const daysElapsedCeil = Math.max(1, Math.ceil(now.diff(enableAt, 'day', true)));

  let primaryText: ReactNode = '';
  let tone: 'live' | 'warn' | 'danger' = 'live';

  if (isTime && isOver) {
    primaryText = '已过期';
    tone = 'danger';
  } else if (now.diff(enableAt) < 60 * 60 * 1000) {
    primaryText = '刚刚启用';
  } else if (hoursElapsed < 24) {
    const hours = Math.max(1, hoursElapsed);
    primaryText = (
      <>
        已启用 <b>{hours}</b> 小时
      </>
    );
  } else {
    primaryText = (
      <>
        已启用 <b>{daysElapsedCeil}</b> 天
      </>
    );
    // 有效期过期时间小于7天时，显示警告
    if (validExpireAt) {
      const daysLeft = Math.ceil(validExpireAt.diff(now, 'day', true));
      if (daysLeft <= 7) {
        tone = 'warn';
      }
    }
  }

  const dateText = enableAt!.format('YYYY-MM-DD HH:mm:ss');

  return (
    <div className={classNames(styles['cell'], styles['isLive'])}>
      <div className={styles['primary']}>
        <i
          className={classNames(styles['led'], {
            [styles['ledWarn']]: tone === 'warn',
            [styles['ledDanger']]: tone === 'danger',
          })}
          aria-hidden='true'
        />
        <strong
          className={classNames({
            [styles['warn']]: tone === 'warn',
            [styles['danger']]: tone === 'danger',
          })}>
          {primaryText}
        </strong>
      </div>
      {isTime && effectiveValidDays != null ? (
        <div className={styles['date']}>
          有效期 <b>{effectiveValidDays}</b> 天
        </div>
      ) : null}
      {/* 启用时间 */}
      <div className={styles['date']}>{dateText}</div>
    </div>
  );
};

export default EnableTimeCell;

interface Props {
  record: CardSecretListItem;
}
