import type { AuthInfoListItem } from '@/types/authInfo';
import dayjs from 'dayjs';
import { isAuthInfoComplete } from '../../utils';
import styles from './index.module.less';

/**
 * 认证信息统计面板
 * @example
 * ```tsx
 * <AuthInfoStat list={dataSource} />
 * ```
 */
const AuthInfoStat: React.FC<Props> = (props) => {
  const { list } = props;

  const stats = useMemo(() => {
    const total = list.length;
    const complete = list.filter((item) => isAuthInfoComplete(item)).length;
    const incomplete = total - complete;
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
    const completePercent = total ? Math.round((complete / total) * 1000) / 10 : 0;
    const incompletePercent = total ? Math.round((incomplete / total) * 1000) / 10 : 0;

    return {
      total,
      complete,
      incomplete,
      todayCount,
      yesterdayCount,
      completePercent,
      incompletePercent,
      todayDiffPercent,
    };
  }, [list]);

  return (
    <div className={styles['statRow']}>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>认证总数</span>
        <span className={styles['statValue']}>{stats.total}</span>
        <span className={`${styles['statDesc']} ${styles['statDescSuccess']}`}>
          {stats.complete > 0 ? '配置可用' : '暂无完整配置'}
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>完整配置</span>
        <span className={styles['statValue']}>{stats.complete}</span>
        <span className={`${styles['statDesc']} ${styles['statDescPrimary']}`}>
          {stats.completePercent}%
        </span>
      </div>
      <div className={styles['statCard']}>
        <span className={styles['statLabel']}>不完整</span>
        <span className={styles['statValue']}>{stats.incomplete}</span>
        <span className={`${styles['statDesc']} ${styles['statDescWarning']}`}>
          {stats.incompletePercent}%
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

export default AuthInfoStat;

interface Props {
  list: AuthInfoListItem[];
}
