import { memo, useMemo } from 'react';
import styles from './index.module.less';
import type { ListItem } from '@/types/qqMusic/songList';
import { UserOutlined } from '@ant-design/icons';

export interface SongListCardProps {
  data: ListItem;
  onClick?: (dissid: string) => void;
}

function formatListenCount(count: number): string {
  console.log('count', count);
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return String(count);
}

function SongListCard({ data, onClick }: SongListCardProps) {
  const { dissid, dissname, imgurl, introduction, listennum, creator } = data;

  const creatorName = useMemo(() => creator?.name || '未知作者', [creator]);

  const handleClick = () => {
    if (onClick) onClick(dissid);
  };

  return (
    <article
      className={styles['card']}
      role='listitem'
      tabIndex={0}
      aria-label={dissname}
      onClick={handleClick}>
      <div className={styles['cover-wrap']}>
        <img className={styles['cover']} src={imgurl} alt={dissname} loading='lazy' />
        <span className={styles['listen']}>{formatListenCount(listennum)}</span>
      </div>
      <div className={styles['info']}>
        <h4 className={styles['title']} title={dissname}>
          {dissname}
        </h4>
        {introduction && (
          <p className={styles['intro']} title={introduction}>
            {introduction}
          </p>
        )}
        <div className={styles['creator']} aria-label={`作者 ${creatorName}`}>
          <UserOutlined className={styles['creator-icon']} />
          <span className={styles['creator-name']}>{creatorName}</span>
        </div>
      </div>
    </article>
  );
}

export default memo(SongListCard);
