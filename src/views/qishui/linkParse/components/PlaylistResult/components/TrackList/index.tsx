import type { PlaylistMusicInfo } from '@/types/qishui';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudDownloadOutlined,
  FileTextOutlined,
  LoadingOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { formatDuration, isTrackParsed } from '../../../../utils';
import sharedStyles from '../shared.module.less';
import styles from './index.module.less';

export type BatchAction = 'parse' | 'download' | 'retry' | 'lrc' | 'txt' | null;

interface TrackListProps {
  tracks: PlaylistMusicInfo[];
  filter: string;
  parsingIds: Set<string>;
  downloadingIds: Set<string>;
  batchAction: BatchAction;
  failCount: number;
  /** 进行中实时成功数（解析 / 下载） */
  liveSuccessCount: number;
  /** 进行中实时失败数（解析 / 下载） */
  liveFailCount: number;
  /** 统计类型：解析中 / 下载中或已有下载结果 */
  statKind: 'parse' | 'download' | null;
  statSuccessCount: number;
  statFailCount: number;
  onParseAll: () => void;
  onDownloadAll: () => void;
  onRetryFailedDownloads: () => void;
  onDownloadAllLyrics: (mode: 'lrc' | 'txt') => void;
  onFilterChange: (value: string) => void;
  onParse: (track: PlaylistMusicInfo) => void;
  onDownload: (track: PlaylistMusicInfo) => void;
  onDownloadLyric: (track: PlaylistMusicInfo, mode: 'lrc' | 'txt') => void;
}

/** 歌单曲目列表 */
const TrackList: React.FC<TrackListProps> = ({
  tracks,
  filter,
  parsingIds,
  downloadingIds,
  batchAction,
  failCount,
  liveSuccessCount,
  liveFailCount,
  statKind,
  statSuccessCount,
  statFailCount,
  onParseAll,
  onDownloadAll,
  onRetryFailedDownloads,
  onDownloadAllLyrics,
  onFilterChange,
  onParse,
  onDownload,
  onDownloadLyric,
}) => {
  const filteredTracks = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) return tracks;
    return tracks.filter(
      (track) =>
        (track.title || '').toLowerCase().includes(keyword) ||
        (track.artist || '').toLowerCase().includes(keyword),
    );
  }, [tracks, filter]);

  const showStats = Boolean(statKind) || statSuccessCount > 0 || statFailCount > 0;
  const successLabel = statKind === 'parse' ? '解析成功' : '下载成功';
  const failLabel = statKind === 'parse' ? '解析失败' : '下载失败';
  const batchBusy = batchAction !== null;
  const showParseLive = batchAction === 'parse';
  const showDownloadLive = batchAction === 'download' || batchAction === 'retry';

  return (
    <>
      <div className={styles['batchBar']} role='toolbar' aria-label='歌单批量操作'>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnPrimary'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={onParseAll}
        >
          {batchAction === 'parse' ? <LoadingOutlined /> : <ThunderboltOutlined />}
          全部解析
          {showParseLive ? (
            <>
              <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
                {liveSuccessCount}
              </span>
              <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
                {liveFailCount}
              </span>
            </>
          ) : null}
        </button>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={onDownloadAll}
        >
          {batchAction === 'download' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
          全部下载
          {showDownloadLive ? (
            <>
              <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
                {liveSuccessCount}
              </span>
              <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
                {liveFailCount}
              </span>
            </>
          ) : (
            <span className={styles['btnCount']}>{tracks.length}</span>
          )}
        </button>
        {failCount > 0 ? (
          <button
            className={classNames(
              sharedStyles['btn'],
              sharedStyles['btnGhost'],
              styles['btnRetry'],
            )}
            type='button'
            disabled={batchBusy}
            onClick={onRetryFailedDownloads}
          >
            {batchAction === 'retry' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
            重试下载失败歌曲
            <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
              {batchAction === 'retry' ? liveFailCount : failCount}
            </span>
          </button>
        ) : null}
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={() => onDownloadAllLyrics('lrc')}
        >
          {batchAction === 'lrc' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 lrc 歌词
        </button>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={() => onDownloadAllLyrics('txt')}
        >
          {batchAction === 'txt' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 txt 歌词
        </button>
      </div>
      <div className={styles['toolbar']}>
        <div className={styles['countRow']}>
          <span className={styles['count']}>共 {filteredTracks.length} 首</span>
          {showStats ? (
            <>
              <span className={styles['countDivider']} aria-hidden='true'>
                ·
              </span>
              <span className={styles['countSuccess']}>
                {successLabel} {statSuccessCount}
              </span>
              <span className={styles['countFail']}>
                {failLabel} {statFailCount}
              </span>
            </>
          ) : null}
        </div>
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
        {filteredTracks.map((track, index) => {
          const key = track.id || String(index);
          const parsed = isTrackParsed(track);
          const parsing = Boolean(track.id && parsingIds.has(track.id));
          const downloading = Boolean(track.id && downloadingIds.has(track.id));
          const downloadStatus = track.downloadStatus;

          return (
            <li
              key={key}
              className={classNames(styles['item'], {
                [styles['itemParsed']]: parsed,
                [styles['itemBusy']]: parsing || downloading,
              })}
            >
              <span className={styles['index']}>{String(index + 1).padStart(2, '0')}</span>
              <img className={styles['itemCover']} src={track.cover} alt='' />
              <div className={styles['info']}>
                <p className={styles['itemTitle']}>{track.title || '未知歌曲'}</p>
                <p className={styles['itemArtist']}>
                  <span className={styles['itemArtistName']}>{track.artist || '未知艺人'}</span>
                  {downloading ? (
                    <LoadingOutlined
                      className={styles['downloadMarkLoading']}
                      aria-label='下载中'
                    />
                  ) : null}
                  {!downloading && downloadStatus === 'success' ? (
                    <CheckCircleFilled className={styles['downloadMarkOk']} aria-label='下载成功' />
                  ) : null}
                  {!downloading && downloadStatus === 'error' ? (
                    <CloseCircleFilled
                      className={styles['downloadMarkFail']}
                      aria-label='下载失败'
                    />
                  ) : null}
                </p>
              </div>
              <span className={styles['duration']}>
                {formatDuration((track.duration || 0) / 1000)}
              </span>
              <div className={styles['itemActions']}>
                {track.isPreviewOnly ? (
                  <span className={styles['previewTag']}>
                    试听 {(track.previewDuration || 30) / 1000}s
                  </span>
                ) : null}
                {!parsed ? (
                  <button
                    className={classNames(
                      sharedStyles['btn'],
                      sharedStyles['btnGhost'],
                      sharedStyles['btnSm'],
                    )}
                    type='button'
                    disabled={!track.id || parsing}
                    aria-label={`解析歌曲 ${track.title}`}
                    onClick={() => onParse(track)}
                  >
                    {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                    解析
                  </button>
                ) : (
                  <>
                    <button
                      className={classNames(
                        sharedStyles['btn'],
                        sharedStyles['btnGhost'],
                        sharedStyles['btnSm'],
                      )}
                      type='button'
                      disabled={downloading}
                      aria-label={`下载歌曲 ${track.title}`}
                      onClick={() => onDownload(track)}
                    >
                      {downloading ? <LoadingOutlined /> : <CloudDownloadOutlined />}
                      下载
                    </button>
                    <button
                      className={classNames(
                        sharedStyles['btn'],
                        sharedStyles['btnGhost'],
                        sharedStyles['btnSm'],
                      )}
                      type='button'
                      disabled={downloading}
                      aria-label={`下载歌词 lrc ${track.title}`}
                      onClick={() => onDownloadLyric(track, 'lrc')}
                    >
                      <FileTextOutlined />
                      lrc
                    </button>
                    <button
                      className={classNames(
                        sharedStyles['btn'],
                        sharedStyles['btnGhost'],
                        sharedStyles['btnSm'],
                      )}
                      type='button'
                      disabled={downloading}
                      aria-label={`下载歌词 txt ${track.title}`}
                      onClick={() => onDownloadLyric(track, 'txt')}
                    >
                      <FileTextOutlined />
                      txt
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default TrackList;
