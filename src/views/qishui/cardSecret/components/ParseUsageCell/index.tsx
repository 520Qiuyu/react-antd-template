import type { CardSecretListItem } from '@/types/cardSecret';
import classNames from 'classnames';
import styles from './index.module.less';

/**
 * 卡密解析用量单元格：紧凑双行 + 主进度条，点击可跳转日志
 * @example
 * ```tsx
 * <ParseUsageCell record={record} onClick={() => handleGoParseLogs(record)} />
 * ```
 */
const ParseUsageCell: React.FC<Props> = ({ record, onClick }) => {
  const hasDailyLimit = record.dailyParseLimit != null && record.dailyParseLimit > 0;
  const dailyUsed = record.dailyParsedCount ?? 0;
  const dailyLimit = record.dailyParseLimit || 0;
  const dailyPercent = hasDailyLimit
    ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 1000) / 10)
    : 0;

  const hasTotalLimit = record.type === 'count' && (record.parseLimit || 0) > 0;
  const totalUsed = record.parsedCount || 0;
  const totalLimit = record.parseLimit || 0;
  const totalRemain = hasTotalLimit ? Math.max(0, totalLimit - totalUsed) : null;
  const totalPercent = hasTotalLimit
    ? Math.min(100, Math.round((totalUsed / totalLimit) * 1000) / 10)
    : 0;

  const dailyIsPrimary = hasDailyLimit && record.type === 'time';
  const primaryPercent = dailyIsPrimary ? dailyPercent : totalPercent;
  const showPrimaryBar = dailyIsPrimary ? hasDailyLimit : hasTotalLimit;

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={styles['cell']}
      role='link'
      tabIndex={0}
      aria-label={`查看卡密 ${record.secret} 的解析日志`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}>
      {hasDailyLimit ? (
        <div className={styles['line']}>
          <span className={styles['label']}>今日</span>
          <span className={styles['nums']}>
            <strong className={dailyIsPrimary ? styles['isPrimary'] : undefined}>
              {dailyUsed}
            </strong>
            <span>/ {dailyLimit}</span>
          </span>
        </div>
      ) : null}

      <div className={styles['line']}>
        <span className={styles['label']}>总解析</span>
        <span className={styles['nums']}>
          <strong className={!dailyIsPrimary ? styles['isPrimary'] : undefined}>
            {totalUsed}
          </strong>
          {hasTotalLimit ? <span>/ {totalLimit}</span> : null}
          {totalRemain !== null ? <em>剩 {totalRemain}</em> : null}
        </span>
      </div>

      {showPrimaryBar ? (
        <div
          className={styles['track']}
          role='progressbar'
          aria-valuenow={primaryPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={dailyIsPrimary ? '今日解析进度' : '总解析进度'}>
          <div
            className={classNames(styles['fill'], {
              [styles['fillWarn']]: primaryPercent >= 90,
            })}
            style={{ width: `${primaryPercent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ParseUsageCell;

interface Props {
  record: CardSecretListItem;
  onClick?: () => void;
}
