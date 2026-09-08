import type { NeteaseApiAlbumInfo } from '@/types/netease';
import { CalendarOutlined, CustomerServiceOutlined, NumberOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import shared from '../../../components/shared.module.less';
import { PLACEHOLDER_COVER } from '../../../mock';
import { toHttpsUrl } from '../../../utils';
import styles from './index.module.less';

interface AlbumHeroProps {
  data: NeteaseApiAlbumInfo;
}

/**
 * 专辑头部信息
 * @example
 * ```tsx
 * <AlbumHero data={album} />
 * ```
 */
const AlbumHero: React.FC<AlbumHeroProps> = ({ data }) => {
  const trackCount = data.size ?? 0;
  const tags = [
    ...new Set([data.type, data.subType, data.company, ...(data.alias || [])].filter(Boolean)),
  ];
  const publishedAt = data.publishTime ? dayjs(data.publishTime).format('YYYY-MM-DD') : '';
  const cover = toHttpsUrl(data.picUrl) || data.picUrl || PLACEHOLDER_COVER;
  const artistAvatar = toHttpsUrl(data.artist?.picUrl) || data.artist?.picUrl || '';

  return (
    <header className={styles['hero']}>
      <img className={styles['cover']} src={cover} alt='专辑封面' />
      <div>
        <h3 className={styles['title']}>{data.name || '未命名专辑'}</h3>
        <p className={styles['owner']}>
          {artistAvatar ? <img className={styles['ownerAvatar']} src={artistAvatar} alt='' /> : null}
          <span>艺人 · {data.artist?.name || '未知'}</span>
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
          {publishedAt ? (
            <span className={shared['statPill']}>
              <CalendarOutlined />
              <span>{publishedAt}</span>
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

export default AlbumHero;
