import { AppstoreOutlined, CustomerServiceOutlined, NumberOutlined } from '@ant-design/icons';
import shared from '../../../components/shared.module.less';
import type { NeteaseArtistInfo } from '../../../types';
import styles from './index.module.less';

interface ArtistHeroProps {
  data: NeteaseArtistInfo;
}

/**
 * 歌手头部信息
 * @example
 * ```tsx
 * <ArtistHero data={MOCK_ARTIST} />
 * ```
 */
const ArtistHero: React.FC<ArtistHeroProps> = ({ data }) => {
  return (
    <header className={styles['hero']}>
      <img className={styles['avatar']} src={data.avatar} alt='歌手头像' />
      <div>
        <h3 className={styles['title']}>{data.name || '未知歌手'}</h3>
        <p className={styles['meta']}>
          {data.area || '未知地区'} · {data.alias || ''}
        </p>
        <div className={styles['stats']}>
          <span className={shared['statPill']}>
            <CustomerServiceOutlined />
            <span>{data.songCount ?? data.hotSongs?.length ?? 0}</span> 单曲
          </span>
          <span className={shared['statPill']}>
            <AppstoreOutlined />
            <span>{data.albumCount ?? data.albums?.length ?? 0}</span> 张专辑
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

export default ArtistHero;
