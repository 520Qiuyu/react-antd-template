import type { PlaylistInfo } from '@/types/qishui';
import { CustomerServiceOutlined, NumberOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface PlaylistHeroProps {
  data: PlaylistInfo;
}

/** 歌单头部信息 */
const PlaylistHero: React.FC<PlaylistHeroProps> = ({ data }) => {
  const trackCount = data.countTracks ?? data.tracks?.length ?? 0;

  return (
    <header className={styles['hero']}>
      <img className={styles['cover']} src={data.cover} alt='歌单封面' />
      <div>
        <h3 className={styles['title']}>{data.title || '未命名歌单'}</h3>
        <p className={styles['owner']}>创建者 · {data.owner || '未知'}</p>
        <div className={styles['stats']}>
          <span className={styles['statPill']}>
            <CustomerServiceOutlined />
            <span>{trackCount}</span> 首
          </span>
          <span className={styles['statPill']}>
            <NumberOutlined />
            <span>{data.id || '—'}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default PlaylistHero;
