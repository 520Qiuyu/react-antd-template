import {
  CalendarOutlined,
  CustomerServiceOutlined,
  NumberOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import shared from '../../../components/shared.module.less';
import type { NeteasePlaylistInfo } from '../../../types';
import { formatPlayCount } from '../../../utils';
import styles from './index.module.less';

interface PlaylistHeroProps {
  data: NeteasePlaylistInfo;
}

/**
 * 歌单头部信息
 * @example
 * ```tsx
 * <PlaylistHero data={playlist} />
 * ```
 */
const PlaylistHero: React.FC<PlaylistHeroProps> = ({ data }) => {
  const trackCount = data.countTracks ?? data.tracks?.length ?? 0;
  const tags = data.tags?.filter(Boolean) || [];
  const createdAt = data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : '';

  return (
    <header className={styles['hero']}>
      <img className={styles['cover']} src={data.cover} alt='歌单封面' />
      <div>
        <h3 className={styles['title']}>{data.title || '未命名歌单'}</h3>
        <p className={styles['owner']}>
          {data.ownerAvatar ? (
            <img className={styles['ownerAvatar']} src={data.ownerAvatar} alt='' />
          ) : null}
          <span>创建者 · {data.owner || '未知'}</span>
        </p>
        {data.description ? <p className={styles['desc']}>{data.description}</p> : null}
        {tags.length ? (
          <div className={styles['tags']}>
            {tags.map((tag) => (
              <span key={tag} className={styles['tag']}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className={styles['stats']}>
          <span className={shared['statPill']}>
            <CustomerServiceOutlined />
            <span>{trackCount}</span> 首
          </span>
          {data.playCount != null ? (
            <span className={shared['statPill']}>
              <PlayCircleOutlined />
              <span>{formatPlayCount(data.playCount)}</span> 播放
            </span>
          ) : null}
          {createdAt ? (
            <span className={shared['statPill']}>
              <CalendarOutlined />
              <span>{createdAt}</span>
            </span>
          ) : null}
          <span className={shared['statPill']}>
            <NumberOutlined />
            <span>{data.id || '—'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default PlaylistHero;
