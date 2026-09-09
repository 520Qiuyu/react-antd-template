import type { AuthInfoListItem, AuthInfoListStats } from '@/types/authInfo';
import styles from './index.module.less';

/**
 * 认证信息统计面板
 * @example
 * ```tsx
 * <AuthInfoStat total={100} stats={stats} />
 * ```
 */
const AuthInfoStat: React.FC<Props> = (props) => {
  const { total, stats } = props;
  const complete = stats?.availableCount ?? 0;
  const incomplete = stats?.unavailableCount ?? 0;
  const todayCount = stats?.todayCount ?? 0;
  const yesterdayCount = stats?.yesterdayCount ?? 0;
  const completePercent = total ? Math.round((complete / total) * 1000) / 10 : 0;
  const incompletePercent = total ? Math.round((incomplete / total) * 1000) / 10 : 0;
  const todayDiffPercent =
    yesterdayCount === 0
      ? todayCount > 0
        ? 100
        : 0
      : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 1000) / 10;

  return (
    <div className={styles['statRow']}>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>认证总数</span>
        <span className={styles['statValue']}>{total}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          {complete > 0 ? '配置可用' : '暂无完整配置'}
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>完整配置</span>
        <span className={styles['statValue']}>{complete}</span>
        <span className={`${styles['statDesc']} ${styles['statDescPrimary']}`}>
          {completePercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>不完整</span>
        <span className={styles['statValue']}>{incomplete}</span>
        <span className={`${styles['statDesc']} ${styles['statDescWarning']}`}>
          {incompletePercent}%
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

export default AuthInfoStat;

interface Props {
  total: number;
  stats?: Partial<AuthInfoListStats>;
}
