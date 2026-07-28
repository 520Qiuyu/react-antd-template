import type { PlaylistMusicInfo } from '@/types/qishui';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudDownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Pagination } from 'antd';
import classNames from 'classnames';
import { formatDuration, isTrackParsed } from '../../../../utils';
import sharedStyles from '../shared.module.less';
import styles from './index.module.less';

/** 每页最多曲目数 */
const PAGE_SIZE = 195;

export type BatchAction = 'parse' | 'download' | 'retry' | 'lrc' | 'txt' | null;

interface TrackListProps {
  tracks: PlaylistMusicInfo[];
  parsingIds: Set<string>;
  downloadingIds: Set<string>;
  /** 进行中实时成功数（解析 / 下载） */
  liveSuccessCount: number;
  /** 进行中实时失败数（解析 / 下载） */
  liveFailCount: number;
  onParseAll: (tracks: PlaylistMusicInfo[]) => Promise<void>;
  onDownloadAll: (tracks: PlaylistMusicInfo[]) => Promise<void>;
  onRetryFailedDownloads: (tracks: PlaylistMusicInfo[]) => Promise<void>;
  onDownloadAllLyrics: (mode: 'lrc' | 'txt') => Promise<void>;
  onParse: (track: PlaylistMusicInfo, silent?: boolean, force?: boolean) => void;
  onDownload: (track: PlaylistMusicInfo) => void;
  onDownloadLyric: (track: PlaylistMusicInfo, mode: 'lrc' | 'txt') => void;
}

/** 歌单曲目列表 */
const TrackList: React.FC<TrackListProps> = ({
  tracks,
  parsingIds,
  downloadingIds,
  liveSuccessCount,
  liveFailCount,
  onParseAll,
  onDownloadAll,
  onRetryFailedDownloads,
  onDownloadAllLyrics,
  onParse,
  onDownload,
  onDownloadLyric,
}) => {
  // 过滤
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const filteredTracks = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) return tracks;
    return tracks.filter(
      (track) =>
        (track.title || '').toLowerCase().includes(keyword) ||
        (track.artist || '').toLowerCase().includes(keyword),
    );
  }, [tracks, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTracks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTracks.slice(start, start + PAGE_SIZE);
  }, [filteredTracks, currentPage]);
  const pageOffset = (currentPage - 1) * PAGE_SIZE;

  const tracksSignature = `${tracks[0]?.id || ''}:${tracks.length}`;

  /** 筛选或歌单切换时回到第一页 */
  useEffect(() => {
    setPage(1);
  }, [filter, tracksSignature]);

  /** 选中的歌曲 */
  const [selectedTracks, setSelectedTracks] = useState<PlaylistMusicInfo[]>([]);
  /** 添加选中的歌曲 */
  const addSelectedTrack = (track: PlaylistMusicInfo) => {
    setSelectedTracks((prev) => [...prev, track]);
  };
  /** 删除选中的歌曲 */
  const removeSelectedTrack = (track: PlaylistMusicInfo) => {
    setSelectedTracks((prev) => prev.filter((t) => t.id !== track.id));
  };

  const [batchAction, setBatchAction] = useState<BatchAction>(null);
  const { downloadSuccessCount, downloadFailCount } = useMemo(() => {
    let success = 0;
    let failed = 0;
    for (const track of tracks) {
      if (track.downloadStatus === 'success') success += 1;
      else if (track.downloadStatus === 'error') failed += 1;
    }
    return { downloadSuccessCount: success, downloadFailCount: failed };
  }, [tracks]);

  /** 全部解析 */
  const handleParseAll = async () => {
    if (batchAction) return;
    setBatchAction('parse');
    try {
      await onParseAll(filteredTracks);
    } finally {
      setBatchAction(null);
    }
  };
  /** 全部下载 */
  const handleDownloadAll = async () => {
    if (batchAction) return;
    setBatchAction('download');
    try {
      await onDownloadAll(filteredTracks);
    } finally {
      setBatchAction(null);
    }
  };
  /** 重试下载失败歌曲 */
  const handleRetryFailedDownloads = async () => {
    if (batchAction) return;
    setBatchAction('retry');
    try {
      await onRetryFailedDownloads(
        filteredTracks?.filter((track) => track.downloadStatus === 'error') || [],
      );
    } finally {
      setBatchAction(null);
    }
  };
  /** 下载全部歌词 */
  const handleDownloadAllLyrics = async (mode: 'lrc' | 'txt') => {
    if (batchAction) return;
    setBatchAction(mode);
    try {
      await onDownloadAllLyrics(mode);
    } finally {
      setBatchAction(null);
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  // 状态
  const isParseBatch = batchAction === 'parse';
  const isDownloadBatch = batchAction === 'download' || batchAction === 'retry';
  const statKind: 'parse' | 'download' | null = isParseBatch
    ? 'parse'
    : isDownloadBatch || downloadSuccessCount > 0 || downloadFailCount > 0
      ? 'download'
      : null;
  const statSuccessCount =
    isParseBatch || isDownloadBatch ? liveSuccessCount : downloadSuccessCount;
  const statFailCount = isParseBatch || isDownloadBatch ? liveFailCount : downloadFailCount;
  const showStats = Boolean(statKind) || statSuccessCount > 0 || statFailCount > 0;
  const successLabel = statKind === 'parse' ? '解析成功' : '下载成功';
  const failLabel = statKind === 'parse' ? '解析失败' : '下载失败';
  const batchBusy = batchAction !== null;
  const showParseLive = batchAction === 'parse';
  const showDownloadLive = batchAction === 'download' || batchAction === 'retry';
  const showPagination = filteredTracks.length > PAGE_SIZE;

  return (
    <>
      <div className={styles['batchBar']} role='toolbar' aria-label='歌单批量操作'>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnPrimary'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={handleParseAll}>
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
          onClick={handleDownloadAll}>
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
        {downloadFailCount > 0 ? (
          <button
            className={classNames(
              sharedStyles['btn'],
              sharedStyles['btnGhost'],
              styles['btnRetry'],
            )}
            type='button'
            disabled={batchBusy}
            onClick={handleRetryFailedDownloads}>
            {batchAction === 'retry' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
            重试下载失败歌曲
            <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
              {batchAction === 'retry' ? liveFailCount : downloadFailCount}
            </span>
          </button>
        ) : null}
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={() => handleDownloadAllLyrics('lrc')}>
          {batchAction === 'lrc' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 lrc 歌词
        </button>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={() => handleDownloadAllLyrics('txt')}>
          {batchAction === 'txt' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 txt 歌词
        </button>
      </div>
      <div className={styles['toolbar']}>
        <div className={styles['countRow']}>
          <span className={styles['count']}>共 {filteredTracks.length} 首</span>
          {showPagination ? (
            <div className={styles['pageNav']} role='group' aria-label='曲目翻页'>
              <button
                className={classNames(
                  sharedStyles['btn'],
                  sharedStyles['btnGhost'],
                  sharedStyles['btnSm'],
                  styles['pageNavBtn'],
                )}
                type='button'
                disabled={currentPage <= 1}
                aria-label='上一页'
                onClick={() => handlePageChange(currentPage - 1)}>
                <LeftOutlined aria-hidden='true' />
                上一页
              </button>
              <span className={styles['count']}>
                第 {currentPage}/{totalPages} 页
              </span>
              <button
                className={classNames(
                  sharedStyles['btn'],
                  sharedStyles['btnGhost'],
                  sharedStyles['btnSm'],
                  styles['pageNavBtn'],
                )}
                type='button'
                disabled={currentPage >= totalPages}
                aria-label='下一页'
                onClick={() => handlePageChange(currentPage + 1)}>
                下一页
                <RightOutlined aria-hidden='true' />
              </button>
            </div>
          ) : null}
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
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
      </div>
      <ul className={styles['list']}>
        {pageTracks.map((track, index) => {
          const globalIndex = pageOffset + index;
          const key = track.id || String(globalIndex);
          const parsed = isTrackParsed(track);
          const hasPlayUrl = Boolean(track.fullInfo?.urls?.some((item) => item.url));
          const noPlayUrl = parsed && !hasPlayUrl;
          const parsing = Boolean(track.id && parsingIds.has(track.id));
          const downloading = Boolean(track.id && downloadingIds.has(track.id));
          const downloadStatus = track.downloadStatus;

          return (
            <li
              key={key}
              className={classNames(styles['item'], {
                [styles['itemParsed']]: parsed && hasPlayUrl,
                [styles['itemNoUrl']]: noPlayUrl,
                [styles['itemBusy']]: parsing || downloading,
              })}
              aria-disabled={noPlayUrl || undefined}>
              <span className={styles['index']}>{String(globalIndex + 1).padStart(2, '0')}</span>
              <div className={styles['itemCoverWrap']}>
                <img className={styles['itemCover']} src={track.cover} alt='' />
                {track.type === 'video' ? (
                  <span className={styles['videoBadge']} aria-label='视频歌曲'>
                    <VideoCameraOutlined />
                    视频
                  </span>
                ) : null}
              </div>
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
                {/* {track.isPreviewOnly ? (
                  <span className={styles['previewTag']}>
                    试听 {(track.previewDuration || 30) / 1000}s
                  </span>
                ) : null} */}
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
                    onClick={() => onParse(track)}>
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
                      disabled={!track.id || parsing}
                      aria-label={`解析歌曲 ${track.title}`}
                      onClick={() => onParse(track, true, true)}>
                      {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                      重新解析
                    </button>
                    <button
                      className={classNames(
                        sharedStyles['btn'],
                        sharedStyles['btnGhost'],
                        sharedStyles['btnSm'],
                      )}
                      type='button'
                      disabled={downloading || noPlayUrl}
                      aria-label={
                        noPlayUrl ? `无播放地址，无法下载 ${track.title}` : `下载歌曲 ${track.title}`
                      }
                      onClick={() => onDownload(track)}>
                      {downloading ? <LoadingOutlined /> : <CloudDownloadOutlined />}
                      下载
                    </button>
                    {track.type === 'track' ? (
                      <>
                        <button
                          className={classNames(
                            sharedStyles['btn'],
                            sharedStyles['btnGhost'],
                            sharedStyles['btnSm'],
                          )}
                          type='button'
                          disabled={downloading}
                          aria-label={`下载歌词 lrc ${track.title}`}
                          onClick={() => onDownloadLyric(track, 'lrc')}>
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
                          onClick={() => onDownloadLyric(track, 'txt')}>
                          <FileTextOutlined />
                          txt
                        </button>
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {showPagination ? (
        <div className={styles['pagination']} aria-label='曲目分页'>
          <Pagination
            size='small'
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredTracks.length}
            showSizeChanger={false}
            showQuickJumper
            onChange={handlePageChange}
          />
        </div>
      ) : null}
    </>
  );
};

export default TrackList;
