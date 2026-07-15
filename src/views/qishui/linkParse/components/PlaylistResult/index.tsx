import { reqGetSongInfo } from '@/apis';
import { useEmbedAudioMetadata } from '@/hooks';
import type { PlaylistInfo, PlaylistMusicInfo } from '@/types/qishui';
import { msgError, msgSuccess } from '@/utils/modal';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudDownloadOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  LoadingOutlined,
  NumberOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { PLAYLIST_PARSE_CONCURRENCY } from '../../constants';
import { downloadSongAudio, downloadSongLyric, runWithConcurrency } from '../../downloadSong';
import { useLinkParseStore } from '../../store/useStore';
import { formatDuration, isTrackParsed, mockParseDelay, pickDownloadUrl } from '../../utils';
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

type BatchAction = 'parse' | 'download' | 'retry' | 'lrc' | 'txt' | null;

interface PlaylistBatchBarProps {
  batchAction: BatchAction;
  disabled: boolean;
  trackCount: number;
  failCount: number;
  /** 进行中实时成功数（解析 / 下载） */
  liveSuccessCount: number;
  /** 进行中实时失败数（解析 / 下载） */
  liveFailCount: number;
  onParseAll: () => void;
  onDownloadAll: () => void;
  onRetryFailedDownloads: () => void;
  onDownloadAllLyrics: (mode: 'lrc' | 'txt') => void;
}

/** 歌单级批量操作 */
const PlaylistBatchBar: React.FC<PlaylistBatchBarProps> = ({
  batchAction,
  disabled,
  trackCount,
  failCount,
  liveSuccessCount,
  liveFailCount,
  onParseAll,
  onDownloadAll,
  onRetryFailedDownloads,
  onDownloadAllLyrics,
}) => {
  const busy = batchAction !== null;
  const showParseLive = batchAction === 'parse';
  const showDownloadLive = batchAction === 'download' || batchAction === 'retry';

  return (
    <div className={styles['batchBar']} role='toolbar' aria-label='歌单批量操作'>
      <button
        className={classNames(styles['btn'], styles['btnPrimary'])}
        type='button'
        disabled={disabled || busy}
        onClick={onParseAll}>
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
        className={classNames(styles['btn'], styles['btnGhost'])}
        type='button'
        disabled={disabled || busy || trackCount === 0}
        onClick={onDownloadAll}>
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
          <span className={styles['btnCount']}>{trackCount}</span>
        )}
      </button>
      {failCount > 0 ? (
        <button
          className={classNames(styles['btn'], styles['btnGhost'], styles['btnRetry'])}
          type='button'
          disabled={busy}
          onClick={onRetryFailedDownloads}>
          {batchAction === 'retry' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
          重试下载失败歌曲
          <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
            {batchAction === 'retry' ? liveFailCount : failCount}
          </span>
        </button>
      ) : null}
      <button
        className={classNames(styles['btn'], styles['btnGhost'])}
        type='button'
        disabled={disabled || busy}
        onClick={() => onDownloadAllLyrics('lrc')}>
        {batchAction === 'lrc' ? <LoadingOutlined /> : <FileTextOutlined />}
        下载全部 lrc 歌词
      </button>
      <button
        className={classNames(styles['btn'], styles['btnGhost'])}
        type='button'
        disabled={disabled || busy}
        onClick={() => onDownloadAllLyrics('txt')}>
        {batchAction === 'txt' ? <LoadingOutlined /> : <FileTextOutlined />}
        下载全部 txt 歌词
      </button>
    </div>
  );
};

interface TrackListProps {
  tracks: PlaylistMusicInfo[];
  filter: string;
  parsingIds: Set<string>;
  downloadingIds: Set<string>;
  /** 统计类型：解析中 / 下载中或已有下载结果 */
  statKind: 'parse' | 'download' | null;
  statSuccessCount: number;
  statFailCount: number;
  onFilterChange: (value: string) => void;
  onParse: (track: PlaylistMusicInfo) => void;
  onDownload: (track: PlaylistMusicInfo) => void;
  onDownloadLyric: (track: PlaylistMusicInfo, mode: 'lrc' | 'txt') => void;
}

/** 歌单曲目列表 */
export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  filter,
  parsingIds,
  downloadingIds,
  statKind,
  statSuccessCount,
  statFailCount,
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

  return (
    <>
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
              })}>
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
                    className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
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
                      className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
                      type='button'
                      disabled={downloading}
                      aria-label={`下载歌曲 ${track.title}`}
                      onClick={() => onDownload(track)}>
                      {downloading ? <LoadingOutlined /> : <CloudDownloadOutlined />}
                      下载
                    </button>
                    <button
                      className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
                      type='button'
                      disabled={downloading}
                      aria-label={`下载歌词 lrc ${track.title}`}
                      onClick={() => onDownloadLyric(track, 'lrc')}>
                      <FileTextOutlined />
                      lrc
                    </button>
                    <button
                      className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
                      type='button'
                      disabled={downloading}
                      aria-label={`下载歌词 txt ${track.title}`}
                      onClick={() => onDownloadLyric(track, 'txt')}>
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

interface PlaylistResultProps {
  data: PlaylistInfo;
}

/**
 * 歌单解析结果
 */
const PlaylistResult: React.FC<PlaylistResultProps> = ({ data }) => {
  const patchPlaylistTrackFullInfo = useLinkParseStore((state) => state.patchPlaylistTrackFullInfo);
  const setTrackDownloadStatus = useLinkParseStore((state) => state.setTrackDownloadStatus);
  const clearPlaylistDownloadStatus = useLinkParseStore(
    (state) => state.clearPlaylistDownloadStatus,
  );
  const { embedMetadata } = useEmbedAudioMetadata();

  const [filter, setFilter] = useState('');
  const [batchAction, setBatchAction] = useState<BatchAction>(null);
  const [batchProgress, setBatchProgress] = useState({ success: 0, failed: 0 });
  const [parsingIds, setParsingIds] = useState<Set<string>>(() => new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(() => new Set());

  const tracks = data.tracks || [];

  const bumpBatchProgress = (ok: boolean) => {
    setBatchProgress((prev) => ({
      success: prev.success + (ok ? 1 : 0),
      failed: prev.failed + (ok ? 0 : 1),
    }));
  };

  const markParsing = (trackId: string, active: boolean) => {
    setParsingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  };

  const markDownloading = (trackId: string, active: boolean) => {
    setDownloadingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  };

  /** 解析单首；返回是否成功。force=true 时即使已解析也会重新请求 */
  const parseTrack = useCallback(
    async (track: PlaylistMusicInfo, silent = false, force = false) => {
      if (!track.id) {
        if (!silent) msgError('缺少歌曲 ID，无法解析');
        return false;
      }
      if (!force && isTrackParsed(track)) return true;

      markParsing(track.id, true);
      try {
        const res = await reqGetSongInfo({ songId: track.id });
        if (res.code !== 200) {
          if (!silent) msgError(res.message || '解析失败');
          return false;
        }
        const fullInfo = res.data?.fullInfo;
        if (!fullInfo?.trackId && !fullInfo?.urls?.length) {
          if (!silent) msgError('未解析到有效歌曲信息');
          return false;
        }
        patchPlaylistTrackFullInfo(track.id, fullInfo);
        return true;
      } catch (error) {
        console.log('parseTrack error', error);
        if (!silent) msgError('解析失败，请稍后重试');
        return false;
      } finally {
        markParsing(track.id, false);
      }
    },
    [patchPlaylistTrackFullInfo],
  );

  /** 读取最新 track（含刚写入的 fullInfo） */
  const getLatestTrack = (trackId: string) =>
    useLinkParseStore.getState().playlistHasResult?.tracks?.find((item) => item.id === trackId);

  /** 补齐未解析曲目（下载前用，跳过已解析） */
  const ensureTracksParsed = useCallback(
    async (targetTracks: PlaylistMusicInfo[]) => {
      const pending = targetTracks.filter((track) => track.id && !isTrackParsed(track));
      let success = 0;
      let failed = 0;

      await runWithConcurrency(pending, PLAYLIST_PARSE_CONCURRENCY, async (track) => {
        const ok = await parseTrack(track, true);
        if (ok) success += 1;
        else failed += 1;
      });

      return { success, failed, total: pending.length };
    },
    [parseTrack],
  );

  /** 全量重新解析（全部解析按钮） */
  const parseAllTracks = useCallback(
    async (targetTracks: PlaylistMusicInfo[]) => {
      const pending = targetTracks.filter((track) => Boolean(track.id));
      let success = 0;
      let failed = 0;

      await runWithConcurrency(pending, PLAYLIST_PARSE_CONCURRENCY, async (track) => {
        const ok = await parseTrack(track, true, true);
        if (ok) success += 1;
        else failed += 1;
        bumpBatchProgress(ok);
      });

      return { success, failed, total: pending.length };
    },
    [parseTrack],
  );

  const handleParse = async (track: PlaylistMusicInfo) => {
    const ok = await parseTrack(track);
    if (ok) msgSuccess('解析成功');
  };

  const handleParseAll = async () => {
    if (batchAction) return;
    setBatchProgress({ success: 0, failed: 0 });
    setBatchAction('parse');
    try {
      const { success, failed, total } = await parseAllTracks(tracks);
      if (total === 0) {
        msgError('没有可解析的曲目');
        return;
      }
      msgSuccess(`解析完成：成功 ${success}，失败 ${failed}`);
    } finally {
      setBatchAction(null);
    }
  };

  const handleDownload = async (track: PlaylistMusicInfo) => {
    const trackId = track.id;
    if (!trackId) {
      msgError('缺少歌曲 ID');
      return;
    }

    markDownloading(trackId, true);
    try {
      let latest = getLatestTrack(trackId) || track;
      if (!isTrackParsed(latest)) {
        const ok = await parseTrack(latest, true);
        if (!ok) {
          msgError('解析失败，无法下载');
          return;
        }
        latest = getLatestTrack(trackId) || latest;
      }

      const fullInfo = latest.fullInfo;
      if (!fullInfo) {
        msgError('未解析到有效歌曲信息');
        return;
      }
      const urlItem = pickDownloadUrl(fullInfo.urls);
      if (!urlItem?.url) {
        msgError('没有可下载的音质地址');
        return;
      }

      await downloadSongAudio({ data: fullInfo, item: urlItem, embedMetadata });
      msgSuccess('下载成功');
    } catch (error) {
      console.error(error);
      msgError(error instanceof Error ? error.message : '下载失败');
    } finally {
      markDownloading(trackId, false);
    }
  };

  const handleDownloadLyric = (track: PlaylistMusicInfo, mode: 'lrc' | 'txt') => {
    const fullInfo = (getLatestTrack(track.id || '') || track).fullInfo;
    if (!fullInfo) {
      msgError('请先解析歌曲');
      return;
    }
    try {
      downloadSongLyric(fullInfo, mode);
      msgSuccess(mode === 'lrc' ? 'lrc 歌词已保存' : 'txt 歌词已保存');
    } catch (error) {
      msgError(error instanceof Error ? error.message : '暂无歌词可保存');
    }
  };

  /** 按给定列表下载音频，并写回成功/失败状态到 tracks */
  const downloadTrackList = async (targetTracks: PlaylistMusicInfo[]) => {
    let success = 0;
    let failed = 0;

    for (const track of targetTracks) {
      if (!track.id || !isTrackParsed(track) || !track.fullInfo) {
        if (track.id) setTrackDownloadStatus(track.id, 'error');
        failed += 1;
        bumpBatchProgress(false);
        continue;
      }
      const urlItem = pickDownloadUrl(track.fullInfo.urls);
      if (!urlItem?.url) {
        setTrackDownloadStatus(track.id, 'error');
        failed += 1;
        bumpBatchProgress(false);
        continue;
      }
      markDownloading(track.id, true);
      try {
        await downloadSongAudio({
          data: track.fullInfo,
          item: urlItem,
          embedMetadata,
        });
        setTrackDownloadStatus(track.id, 'success');
        success += 1;
        bumpBatchProgress(true);
      } catch (error) {
        console.error(error);
        setTrackDownloadStatus(track.id, 'error');
        failed += 1;
        bumpBatchProgress(false);
      } finally {
        markDownloading(track.id, false);
        // await mockParseDelay(500);
      }
    }

    return { success, failed };
  };

  const handleDownloadAll = async () => {
    if (batchAction) return;
    setBatchProgress({ success: 0, failed: 0 });
    setBatchAction('download');
    clearPlaylistDownloadStatus();
    try {
      await ensureTracksParsed(tracks);
      const latestTracks = useLinkParseStore.getState().playlistHasResult?.tracks || tracks;
      const { success, failed } = await downloadTrackList(latestTracks);
      msgSuccess(`下载完成：成功 ${success}，失败 ${failed}`);
    } finally {
      setBatchAction(null);
    }
  };

  const handleRetryFailedDownloads = async () => {
    if (batchAction) return;
    const retryTracks = tracks.filter((track) => track.downloadStatus === 'error');
    if (retryTracks.length === 0) return;

    setBatchProgress({ success: 0, failed: 0 });
    setBatchAction('retry');
    try {
      await ensureTracksParsed(tracks);
      const latestTracks = useLinkParseStore.getState().playlistHasResult?.tracks || tracks;
      const failedIds = new Set(retryTracks.map((track) => track.id).filter(Boolean));
      const targets = latestTracks.filter((track) => track.id && failedIds.has(track.id));
      const { success, failed } = await downloadTrackList(targets);
      msgSuccess(`重试完成：成功 ${success}，失败 ${failed}`);
    } finally {
      setBatchAction(null);
    }
  };

  const handleDownloadAllLyrics = async (mode: 'lrc' | 'txt') => {
    if (batchAction) return;
    setBatchAction(mode);
    try {
      await ensureTracksParsed(tracks);
      const latestTracks = useLinkParseStore.getState().playlistHasResult?.tracks || tracks;
      let success = 0;
      let failed = 0;

      for (const track of latestTracks) {
        if (!isTrackParsed(track) || !track.fullInfo) {
          failed += 1;
          continue;
        }
        try {
          downloadSongLyric(track.fullInfo, mode);
          success += 1;
        } catch {
          failed += 1;
        }
      }

      msgSuccess(`${mode === 'lrc' ? 'lrc' : 'txt'} 下载完成：成功 ${success}，失败 ${failed}`);
    } finally {
      setBatchAction(null);
    }
  };

  const { downloadSuccessCount, downloadFailCount } = useMemo(() => {
    let success = 0;
    let failed = 0;
    for (const track of tracks) {
      if (track.downloadStatus === 'success') success += 1;
      else if (track.downloadStatus === 'error') failed += 1;
    }
    return { downloadSuccessCount: success, downloadFailCount: failed };
  }, [tracks]);

  const isParseBatch = batchAction === 'parse';
  const isDownloadBatch = batchAction === 'download' || batchAction === 'retry';
  const statKind: 'parse' | 'download' | null = isParseBatch
    ? 'parse'
    : isDownloadBatch || downloadSuccessCount > 0 || downloadFailCount > 0
      ? 'download'
      : null;
  const statSuccessCount = isParseBatch
    ? batchProgress.success
    : isDownloadBatch
      ? batchProgress.success
      : downloadSuccessCount;
  const statFailCount = isParseBatch
    ? batchProgress.failed
    : isDownloadBatch
      ? batchProgress.failed
      : downloadFailCount;

  return (
    <div className={styles['result']} aria-live='polite'>
      <PlaylistHero data={data} />
      <PlaylistBatchBar
        batchAction={batchAction}
        disabled={tracks.length === 0}
        trackCount={tracks.length}
        failCount={downloadFailCount}
        liveSuccessCount={batchProgress.success}
        liveFailCount={batchProgress.failed}
        onParseAll={handleParseAll}
        onDownloadAll={handleDownloadAll}
        onRetryFailedDownloads={handleRetryFailedDownloads}
        onDownloadAllLyrics={handleDownloadAllLyrics}
      />
      <TrackList
        tracks={tracks}
        filter={filter}
        parsingIds={parsingIds}
        downloadingIds={downloadingIds}
        statKind={statKind}
        statSuccessCount={statSuccessCount}
        statFailCount={statFailCount}
        onFilterChange={setFilter}
        onParse={handleParse}
        onDownload={handleDownload}
        onDownloadLyric={handleDownloadLyric}
      />
    </div>
  );
};

export default PlaylistResult;
