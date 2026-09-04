import type { NeteaseApiPlaylist } from '@/types/netease';
import {
  CalendarOutlined,
  CustomerServiceOutlined,
  NumberOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import shared from '../../../components/shared.module.less';
import { PLACEHOLDER_COVER } from '../../../mock';
import { formatPlayCount, toHttpsUrl } from '../../../utils';
import styles from './index.module.less';

interface PlaylistHeroProps {
  data: NeteaseApiPlaylist;
}

/**
 * 歌单头部信息
 * @example
 * ```tsx
 * <PlaylistHero data={playlist} />
 * ```
 */
const PlaylistHero: React.FC<PlaylistHeroProps> = ({ data }) => {
  const trackCount = data.trackCount ?? data.tracks?.length ?? 0;
  const tags = data.tags?.filter(Boolean) || [];
  const createdAt = data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : '';
  const cover = toHttpsUrl(data.coverImgUrl) || data.coverImgUrl || PLACEHOLDER_COVER;
  const ownerAvatar = toHttpsUrl(data.creator?.avatarUrl) || data.creator?.avatarUrl || '';

  return (
    <header className={styles['hero']}>
      <img className={styles['cover']} src={cover} alt='歌单封面' />
      <div>
        <h3 className={styles['title']}>{data.name || '未命名歌单'}</h3>
        <p className={styles['owner']}>
          {ownerAvatar ? <img className={styles['ownerAvatar']} src={ownerAvatar} alt='' /> : null}
          <span>创建者 · {data.creator?.nickname || '未知'}</span>
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
