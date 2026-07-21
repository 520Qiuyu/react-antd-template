import type { CardSecretListStats } from '@/types/cardSecret';
import styles from './index.module.less';

/**
 * 卡密统计面板
 * @example
 * ```tsx
 * <CardSecretStat total={100} stats={stats} />
 * ```
 */
const CardSecretStat: React.FC<Props> = (props) => {
  const { total, stats } = props;
  const unused = stats?.unusedCount ?? 0;
  const used = stats?.usedCount ?? 0;
  const todayCount = stats?.todayCount ?? 0;
  const yesterdayCount = stats?.yesterdayCount ?? 0;
  const unusedPercent = total ? Math.round((unused / total) * 1000) / 10 : 0;
  const usedPercent = total ? Math.round((used / total) * 1000) / 10 : 0;
  const todayDiffPercent =
    yesterdayCount === 0
      ? todayCount > 0
        ? 100
        : 0
      : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 1000) / 10;

  return (
    <div className={styles['statRow']}>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>总卡密数</span>
        <span className={styles['statValue']}>{total}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          {unused > 0 ? '库存充足' : '暂无可用'}
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>未使用</span>
        <span className={styles['statValue']}>{unused}</span>
        <span className={`${styles['statDesc']} ${styles['statDescWarning']}`}>
          {unusedPercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>已使用</span>
        <span className={styles['statValue']}>{used}</span>
        <span className={`${styles['statDesc']} ${styles['statDescPrimary']}`}>
          {usedPercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>今日新增</span>
        <span className={styles['statValue']}>{todayCount}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          较昨日({yesterdayCount})
          {todayDiffPercent >= 0 ? '提升' : '下降'} {Math.abs(todayDiffPercent)}%
        </span>
      </div>
    </div>
  );
};

export default CardSecretStat;

interface Props {
  total: number;
  stats?: Partial<CardSecretListStats>;
}
