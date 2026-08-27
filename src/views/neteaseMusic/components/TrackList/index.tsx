import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import shared from '../shared.module.less';
import type { NeteaseTrack } from '../../types';
import { formatDuration } from '../../utils';
import styles from './index.module.less';

interface TrackListProps {
  tracks: NeteaseTrack[];
  filterPlaceholder?: string;
  filterAriaLabel?: string;
}

/**
 * 可筛选曲目列表
 * @example
 * ```tsx
 * <TrackList tracks={playlist.tracks} filterAriaLabel='筛选歌单曲目' />
 * ```
 */
const TrackList: React.FC<TrackListProps> = ({
  tracks,
  filterPlaceholder = '筛选歌曲 / 艺人…',
  filterAriaLabel = '筛选曲目',
}) => {
  const [keyword, setKeyword] = useState('');

  const visibleTracks = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return tracks;
    return tracks.filter(
      (item) =>
        (item.title || '').toLowerCase().includes(query) ||
        (item.artist || '').toLowerCase().includes(query),
    );
  }, [keyword, tracks]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  return (
    <>
      <div className={styles['toolbar']}>
        <span className={styles['count']}>共 {visibleTracks.length} 首</span>
        <div className={styles['search']}>
          <SearchOutlined aria-hidden='true' />
          <input
            type='search'
            placeholder={filterPlaceholder}
            aria-label={filterAriaLabel}
            value={keyword}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      <ul className={styles['list']}>
        {visibleTracks.map((item, index) => (
          <li key={item.id} className={styles['item']}>
            <span className={styles['index']}>{String(index + 1).padStart(2, '0')}</span>
            <img className={styles['cover']} src={item.cover} alt='' />
            <div className={styles['info']}>
              <p className={styles['title']}>{item.title || '未知歌曲'}</p>
              <p className={styles['artist']}>{item.artist || '未知艺人'}</p>
            </div>
            <span className={styles['duration']}>{formatDuration(item.duration || 0)}</span>
            {item.isPreviewOnly ? (
              <span className={styles['previewTag']}>试听 {item.previewDuration || 30}s</span>
            ) : (
              <button
                className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                type='button'
                aria-label={`查看歌曲 ${item.title}`}>
                <ExportOutlined />
                查看
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default TrackList;
