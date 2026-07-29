import { reqGetSongInfo, reqGetVideoInfo } from '@/apis';
import { useEmbedAudioMetadata, useSearchParams } from '@/hooks';
import type { PlaylistInfo, PlaylistMusicInfo } from '@/types/qishui';
import eventBus from '@/utils/eventBus';
import { msgError, msgSuccess } from '@/utils/modal';
import { PLAYLIST_PARSE_CONCURRENCY } from '../../constants';
import { downloadSongAudio, downloadSongLyric, runWithConcurrency } from '../../downloadSong';
import { usePlaylistParseStore } from '../../store';
import { isTrackParsed, pickDownloadUrl } from '../../utils';
import EngineStatus from '../EngineStatus';
import PlaylistHero from './components/PlaylistHero';
import TrackList from './components/TrackList';
import styles from './index.module.less';
import { isDev } from '@/utils';

interface PlaylistResultProps {
  data: PlaylistInfo;
}

/**
 * 歌单解析结果
 */
const PlaylistResult: React.FC<PlaylistResultProps> = ({ data }) => {
  const { searchParams } = useSearchParams();
  /** 更新歌曲完整信息 */
  const patchPlaylistTrackFullInfo = usePlaylistParseStore(
    (state) => state.patchPlaylistTrackFullInfo,
  );
  /** 设置歌曲下载状态 */
  const setTrackDownloadStatus = usePlaylistParseStore((state) => state.setTrackDownloadStatus);
  /** 清除歌曲下载状态 */
  const clearPlaylistDownloadStatus = usePlaylistParseStore(
    (state) => state.clearPlaylistDownloadStatus,
  );
  /** 内嵌音频元数据 */
  const { embedMetadata } = useEmbedAudioMetadata({
    onLog: (message, type) => {
      /* if (isDev) {
        console.log('embedMetadata log', message, type);
      } */
    },
  });

  const [batchProgress, setBatchProgress] = useState({ success: 0, failed: 0 });
  const [parsingIds, setParsingIds] = useState<Set<string>>(() => new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(() => new Set());

  const tracks = data.tracks || [];

  /** 更新批量操作进度 */
  const bumpBatchProgress = (ok: boolean) => {
    setBatchProgress((prev) => ({
      success: prev.success + (ok ? 1 : 0),
      failed: prev.failed + (ok ? 0 : 1),
    }));
  };
  /** 标记解析中 */
  const markParsing = (trackId: string, active: boolean) => {
    setParsingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  };
  /** 标记下载中 */
  const markDownloading = (trackId: string, active: boolean) => {
    setDownloadingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  };

  /** 解析单首；返回是否成功 silent=true 时只显示错误信息，不弹窗。force=true 时即使已解析也会重新请求 */
  const parseTrack = useCallback(
    async (track: PlaylistMusicInfo, silent = false, force = false) => {
      if (!track.id) {
        if (!silent) msgError('缺少歌曲 ID，无法解析');
        return false;
      }
      if (!force && isTrackParsed(track)) return true;

      markParsing(track.id, true);
      try {
        const cardSecret = searchParams.cardSecret;
        const res =
          track.type === 'video'
            ? await reqGetVideoInfo({ videoId: track.id, cardSecret })
            : await reqGetSongInfo({ songId: track.id, cardSecret });
        if (res.code !== 200) {
          // if (!silent) msgError(res.message || '解析失败');
          return false;
        }
        const fullInfo = res.data?.fullInfo;
        if (!fullInfo?.trackId && !fullInfo?.urls?.length) {
          if (!silent) msgError('未解析到有效歌曲信息');
          return false;
        }
        patchPlaylistTrackFullInfo(track.id, fullInfo);
        eventBus.emit('cardSecretRefresh');
        return true;
      } catch (error) {
        console.log('parseTrack error', error);
        if (!silent) msgError('解析失败，请稍后重试');
        return false;
      } finally {
        markParsing(track.id, false);
      }
    },
    [patchPlaylistTrackFullInfo, searchParams.cardSecret],
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

  /** 仅解析尚未解析的曲目 */
  const parseUnparsedTracks = useCallback(
    async (targetTracks: PlaylistMusicInfo[]) => {
      const pending = targetTracks.filter((track) => track.id && !isTrackParsed(track));
      let success = 0;
      let failed = 0;

      await runWithConcurrency(pending, PLAYLIST_PARSE_CONCURRENCY, async (track) => {
        const ok = await parseTrack(track, true);
        if (ok) success += 1;
        else failed += 1;
        bumpBatchProgress(ok);
      });

      return { success, failed, total: pending.length };
    },
    [parseTrack],
  );

  const handleParseAll = async (targetTracks: PlaylistMusicInfo[]) => {
    setBatchProgress({ success: 0, failed: 0 });
    try {
      const { success, failed, total } = await parseAllTracks(targetTracks);
      if (total === 0) {
        msgError('没有可解析的曲目');
        return;
      }
      msgSuccess(`解析完成：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleParseUnparsed = async (targetTracks: PlaylistMusicInfo[]) => {
    setBatchProgress({ success: 0, failed: 0 });
    try {
      const { success, failed, total } = await parseUnparsedTracks(targetTracks);
      if (total === 0) {
        msgError('没有未解析的曲目');
        return;
      }
      msgSuccess(`解析完成：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('error', error);
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
        debugger;
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

  const handleDownloadAll = async (targetTracks: PlaylistMusicInfo[]) => {
    setBatchProgress({ success: 0, failed: 0 });

    clearPlaylistDownloadStatus();
    try {
      await ensureTracksParsed(targetTracks);
      const { success, failed } = await downloadTrackList(targetTracks);
      msgSuccess(`下载完成：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('error', error);
    }
  };

  /** 仅下载尚未成功的曲目，不清空已有成功状态 */
  const handleDownloadUndownloaded = async (targetTracks: PlaylistMusicInfo[]) => {
    if (targetTracks.length === 0) return;
    setBatchProgress({ success: 0, failed: 0 });
    try {
      await ensureTracksParsed(targetTracks);
      const { success, failed } = await downloadTrackList(targetTracks);
      msgSuccess(`下载完成：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleRetryFailedDownloads = async (retryTracks: PlaylistMusicInfo[]) => {
    if (retryTracks.length === 0) return;
    setBatchProgress({ success: 0, failed: 0 });
    try {
      await ensureTracksParsed(retryTracks);
      const failedIds = new Set(retryTracks.map((track) => track.id).filter(Boolean));
      const targets = retryTracks.filter((track) => track.id && failedIds.has(track.id));
      const { success, failed } = await downloadTrackList(targets);
      msgSuccess(`重试完成：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleDownloadAllLyrics = async (mode: 'lrc' | 'txt') => {
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
  };

  return (
    <div className={styles['result']} aria-live='polite'>
      <EngineStatus />
      <PlaylistHero data={data} />
      <TrackList
        tracks={tracks}
        parsingIds={parsingIds}
        downloadingIds={downloadingIds}
        liveSuccessCount={batchProgress.success}
        liveFailCount={batchProgress.failed}
        onParseAll={handleParseAll}
        onParseUnparsed={handleParseUnparsed}
        onDownloadAll={handleDownloadAll}
        onDownloadUndownloaded={handleDownloadUndownloaded}
        onRetryFailedDownloads={handleRetryFailedDownloads}
        onDownloadAllLyrics={handleDownloadAllLyrics}
        onParse={parseTrack}
        onDownload={handleDownload}
        onDownloadLyric={handleDownloadLyric}
      />
    </div>
  );
};

export default PlaylistResult;
