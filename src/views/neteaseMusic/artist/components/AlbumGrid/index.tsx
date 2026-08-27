import { ExportOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import shared from '../../../components/shared.module.less';
import type { NeteaseArtistAlbum } from '../../../types';
import styles from './index.module.less';

interface AlbumGridProps {
  albums: NeteaseArtistAlbum[];
}

/**
 * 歌手专辑卡片网格
 * @example
 * ```tsx
 * <AlbumGrid albums={MOCK_ARTIST.albums} />
 * ```
 */
const AlbumGrid: React.FC<AlbumGridProps> = ({ albums }) => {
  return (
    <div className={styles['grid']}>
      {albums.map((album) => (
        <article key={album.id} className={styles['card']}>
          <img className={styles['cover']} src={album.cover} alt='' />
          <p className={styles['title']}>{album.title || '未命名专辑'}</p>
          <p className={styles['year']}>{album.year || '—'}</p>
          <button
            className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
            type='button'
            aria-label={`查看专辑 ${album.title}`}>
            <ExportOutlined />
            查看
          </button>
        </article>
      ))}
    </div>
  );
};

export default AlbumGrid;
