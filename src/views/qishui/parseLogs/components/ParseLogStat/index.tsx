import type { ParseLogListStats } from '@/types/parseLog';
import styles from './index.module.less';

/**
 * 解析日志统计面板
 * @example
 * ```tsx
 * <ParseLogStat total={100} stats={stats} />
 * ```
 */
const ParseLogStat: React.FC<Props> = (props) => {
  const { total, stats } = props;
  const successCount = stats?.successCount ?? 0;
  const failCount = stats?.failCount ?? 0;
  const todayCount = stats?.todayCount ?? 0;
  const yesterdayCount = stats?.yesterdayCount ?? 0;
  const successPercent = total ? Math.round((successCount / total) * 1000) / 10 : 0;
  const failPercent = total ? Math.round((failCount / total) * 1000) / 10 : 0;
  const todayDiffPercent =
    yesterdayCount === 0
      ? todayCount > 0
        ? 100
        : 0
      : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 1000) / 10;

  return (
    <div className={styles['statRow']}>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>总解析次数</span>
        <span className={styles['statValue']}>{total}</span>
        <span className={`${styles['statDesc']} ${styles['statDescPrimary']}`}>全部记录</span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>成功</span>
        <span className={styles['statValue']}>{successCount}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          {successPercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>失败</span>
        <span className={styles['statValue']}>{failCount}</span>
        <span className={`${styles['statDesc']} ${styles['statDescWarning']}`}>{failPercent}%</span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>今日解析</span>
        <span className={styles['statValue']}>{todayCount}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          较昨日({yesterdayCount})
          {todayDiffPercent >= 0 ? '提升' : '下降'} {Math.abs(todayDiffPercent)}%
        </span>
      </div>
    </div>
  );
};

export default ParseLogStat;

interface Props {
  total: number;
  stats?: Partial<ParseLogListStats>;
}
