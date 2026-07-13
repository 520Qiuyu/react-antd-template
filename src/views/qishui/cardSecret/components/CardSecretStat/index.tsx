import type { CardSecretListItem } from '@/types/cardSecret';
import dayjs from 'dayjs';
import styles from './index.module.less';

/**
 * 卡密统计面板
 * @example
 * ```tsx
 * <CardSecretStat list={dataSource} />
 * ```
 */
const CardSecretStat: React.FC<Props> = (props) => {
  const { list } = props;

  const stats = useMemo(() => {
    const total = list.length;
    const unused = list.filter((item) => item.parsedCount === 0).length;
    const used = total - unused;
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');
    const todayCount = list.filter((item) => dayjs(item.ctime).isSame(today, 'day')).length;
    const yesterdayCount = list.filter((item) => dayjs(item.ctime).isSame(yesterday, 'day')).length;
    const todayDiffPercent =
      yesterdayCount === 0
        ? todayCount > 0
          ? 100
          : 0
        : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 1000) / 10;
    const unusedPercent = total ? Math.round((unused / total) * 1000) / 10 : 0;
    const usedPercent = total ? Math.round((used / total) * 1000) / 10 : 0;

    return {
      total,
      unused,
      used,
      todayCount,
      yesterdayCount,
      unusedPercent,
      usedPercent,
      todayDiffPercent,
    };
  }, [list]);

  return (
    <div className={styles['statRow']}>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>总卡密数</span>
        <span className={styles['statValue']}>{stats.total}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          {stats.unused > 0 ? '库存充足' : '暂无可用'}
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>未使用</span>
        <span className={styles['statValue']}>{stats.unused}</span>
        <span className={`${styles['statDesc']} ${styles['statDescWarning']}`}>
          {stats.unusedPercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>已使用</span>
        <span className={styles['statValue']}>{stats.used}</span>
        <span className={`${styles['statDesc']} ${styles['statDescPrimary']}`}>
          {stats.usedPercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>今日新增</span>
        <span className={styles['statValue']}>{stats.todayCount}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          较昨日({stats.yesterdayCount})
          {stats.todayDiffPercent >= 0 ? '提升' : '下降'} {Math.abs(stats.todayDiffPercent)}%
        </span>
      </div>
    </div>
  );
};

export default CardSecretStat;

interface Props {
  list: CardSecretListItem[];
}
