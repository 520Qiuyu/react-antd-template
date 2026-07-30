import styles from './index.module.less';

/**
 * 黑名单统计面板
 * @example
 * ```tsx
 * <BlacklistStat totalActive={3} pageManualCount={1} pageAutoCount={2} />
 * ```
 */
const BlacklistStat: React.FC<Props> = (props) => {
  const { totalActive, pageManualCount, pageAutoCount } = props;

  return (
    <div className={styles['statRow']}>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>黑名单总数</span>
        <span className={styles['statValue']}>{totalActive}</span>
        <span className={`${styles['statDesc']} ${styles['statDescMuted']}`}>条（生效中）</span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>当前页 · 手动拉黑</span>
        <span className={`${styles['statValue']} ${styles['statValueDanger']}`}>
          {pageManualCount}
        </span>
        <span className={`${styles['statDesc']} ${styles['statDescDanger']}`}>条</span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>当前页 · 自动拉黑</span>
        <span className={`${styles['statValue']} ${styles['statValueWarning']}`}>
          {pageAutoCount}
        </span>
        <span className={`${styles['statDesc']} ${styles['statDescWarning']}`}>条</span>
      </div>
    </div>
  );
};

export default BlacklistStat;

interface Props {
  totalActive: number;
  pageManualCount: number;
  pageAutoCount: number;
}
