import { CustomerServiceOutlined, NumberOutlined } from '@ant-design/icons';
import shared from '../../../components/shared.module.less';
import type { NeteasePlaylistInfo } from '../../../types';
import styles from './index.module.less';

interface PlaylistHeroProps {
  data: NeteasePlaylistInfo;
}

/**
 * 歌单头部信息
 * @example
 * ```tsx
 * <PlaylistHero data={MOCK_PLAYLIST} />
 * ```
 */
const PlaylistHero: React.FC<PlaylistHeroProps> = ({ data }) => {
  const trackCount = data.countTracks ?? data.tracks?.length ?? 0;

  return (
    <header className={styles['hero']}>
      <img className={styles['cover']} src={data.cover} alt='歌单封面' />
      <div>
        <h3 className={styles['title']}>{data.title || '未命名歌单'}</h3>
        <p className={styles['owner']}>创建者 · {data.owner || '未知'}</p>
        <div className={styles['stats']}>
          <span className={shared['statPill']}>
            <CustomerServiceOutlined />
            <span>{trackCount}</span> 首
          </span>
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
