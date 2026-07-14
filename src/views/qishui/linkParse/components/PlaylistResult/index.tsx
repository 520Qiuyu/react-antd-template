import {
  CustomerServiceOutlined,
  ExportOutlined,
  NumberOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import type { PlaylistInfo, PlaylistMusicInfo } from '@/types/qishui';
import { formatDuration } from '../../utils';
import styles from './index.module.less';

interface PlaylistHeroProps {
  data: PlaylistInfo;
}

/** 歌单头部信息 */
export const PlaylistHero: React.FC<PlaylistHeroProps> = ({ data }) => {
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

interface TrackListProps {
  tracks: PlaylistMusicInfo[];
  filter: string;
  onFilterChange: (value: string) => void;
}

/** 歌单曲目列表 */
export const TrackList: React.FC<TrackListProps> = ({ tracks, filter, onFilterChange }) => {
  const filteredTracks = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) return tracks;
    return tracks.filter(
      (track) =>
        (track.title || '').toLowerCase().includes(keyword) ||
        (track.artist || '').toLowerCase().includes(keyword),
    );
  }, [tracks, filter]);

  return (
    <>
      <div className={styles['toolbar']}>
        <span className={styles['count']}>共 {filteredTracks.length} 首</span>
        <div className={styles['search']}>
          <SearchOutlined aria-hidden='true' />
          <input
            type='search'
            placeholder='筛选歌曲 / 艺人…'
            aria-label='筛选歌单曲目'
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          />
        </div>
      </div>
      <ul className={styles['list']}>
        {filteredTracks.map((track, index) => (
          <li key={track.id || index} className={styles['item']}>
            <span className={styles['index']}>{String(index + 1).padStart(2, '0')}</span>
            <img className={styles['itemCover']} src={track.cover} alt='' />
            <div className={styles['info']}>
              <p className={styles['itemTitle']}>{track.title || '未知歌曲'}</p>
              <p className={styles['itemArtist']}>{track.artist || '未知艺人'}</p>
            </div>
            <span className={styles['duration']}>{formatDuration(track.duration || 0)}</span>
            {track.isPreviewOnly ? (
              <span className={styles['previewTag']}>试听 {track.previewDuration || 30}s</span>
            ) : (
              <button
                className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
                type='button'
                aria-label={`查看歌曲 ${track.title}`}>
                <ExportOutlined />
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

interface PlaylistResultProps {
  data: PlaylistInfo;
}

/**
 * 歌单解析结果
 */
const PlaylistResult: React.FC<PlaylistResultProps> = ({ data }) => {
  const [filter, setFilter] = useState('');

  return (
    <div className={styles['result']} aria-live='polite'>
      <PlaylistHero data={data} />
      <TrackList tracks={data.tracks || []} filter={filter} onFilterChange={setFilter} />
    </div>
  );
};

export default PlaylistResult;
