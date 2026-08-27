import { CalendarOutlined, CustomerServiceOutlined, NumberOutlined } from '@ant-design/icons';
import shared from '../../../components/shared.module.less';
import type { NeteaseAlbumInfo } from '../../../types';
import styles from './index.module.less';

interface AlbumHeroProps {
  data: NeteaseAlbumInfo;
}

/**
 * 专辑头部信息
 * @example
 * ```tsx
 * <AlbumHero data={MOCK_ALBUM} />
 * ```
 */
const AlbumHero: React.FC<AlbumHeroProps> = ({ data }) => {
  const trackCount = data.countTracks ?? data.tracks?.length ?? 0;

  return (
    <header className={styles['hero']}>
      <img className={styles['cover']} src={data.cover} alt='专辑封面' />
      <div>
        <h3 className={styles['title']}>{data.title || '未命名专辑'}</h3>
        <p className={styles['owner']}>
          {data.artist || '未知艺人'} · {data.company || '未知厂牌'}
        </p>
        <div className={styles['stats']}>
          <span className={shared['statPill']}>
            <CustomerServiceOutlined />
            <span>{trackCount}</span> 首
          </span>
          <span className={shared['statPill']}>
            <CalendarOutlined />
            <span>{data.year || '—'}</span>
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

export default AlbumHero;
