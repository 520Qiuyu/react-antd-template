import { reqGetSongInfo } from '@/apis';
import { useEmbedAudioMetadata } from '@/hooks';
import type { PlaylistInfo, PlaylistMusicInfo } from '@/types/qishui';
import { msgError, msgSuccess } from '@/utils/modal';
import { PLAYLIST_PARSE_CONCURRENCY } from '../../constants';
import { downloadSongAudio, downloadSongLyric, runWithConcurrency } from '../../downloadSong';
import { usePlaylistParseStore } from '../../store';
import { isTrackParsed, mockParseDelay, pickDownloadUrl } from '../../utils';
import EngineStatus from '../EngineStatus';
import PlaylistHero from './components/PlaylistHero';
import TrackList, { type BatchAction } from './components/TrackList';
import styles from './index.module.less';

interface PlaylistResultProps {
  data: PlaylistInfo;
}

/**
 * 歌单解析结果
 */
const PlaylistResult: React.FC<PlaylistResultProps> = ({ data }) => {
  const patchPlaylistTrackFullInfo = usePlaylistParseStore(
    (state) => state.patchPlaylistTrackFullInfo,
  );
  const setTrackDownloadStatus = usePlaylistParseStore((state) => state.setTrackDownloadStatus);
  const clearPlaylistDownloadStatus = usePlaylistParseStore(
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
    usePlaylistParseStore.getState().playlistHasResult?.tracks?.find((item) => item.id === trackId);

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
      const latestTracks = usePlaylistParseStore.getState().playlistHasResult?.tracks || tracks;
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
      const latestTracks = usePlaylistParseStore.getState().playlistHasResult?.tracks || tracks;
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
      const latestTracks = usePlaylistParseStore.getState().playlistHasResult?.tracks || tracks;
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
      <EngineStatus />
      <PlaylistHero data={data} />
      <TrackList
        tracks={tracks}
        filter={filter}
        parsingIds={parsingIds}
        downloadingIds={downloadingIds}
        batchAction={batchAction}
        failCount={downloadFailCount}
        liveSuccessCount={batchProgress.success}
        liveFailCount={batchProgress.failed}
        statKind={statKind}
        statSuccessCount={statSuccessCount}
        statFailCount={statFailCount}
        onParseAll={handleParseAll}
        onDownloadAll={handleDownloadAll}
        onRetryFailedDownloads={handleRetryFailedDownloads}
        onDownloadAllLyrics={handleDownloadAllLyrics}
        onFilterChange={setFilter}
        onParse={handleParse}
        onDownload={handleDownload}
        onDownloadLyric={handleDownloadLyric}
      />
    </div>
  );
};

export default PlaylistResult;
