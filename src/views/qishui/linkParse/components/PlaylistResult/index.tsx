import { reqGetSongInfo, reqGetVideoInfo } from '@/apis';
import { useEmbedAudioMetadata, useSearchParams } from '@/hooks';
import { DEFAULT_CONFIG, useConfig } from '@/hooks/useConfig';
import type { PlaylistInfo, PlaylistMusicInfo } from '@/types/qishui';
import { downloadAsJson } from '@/utils/download';
import eventBus from '@/utils/eventBus';
import { msgError, msgSuccess } from '@/utils/modal';
import { downloadSongAudio, downloadSongLyric, runWithConcurrency } from '../../downloadSong';
import { usePlaylistParseStore } from '../../store';
import { isTrackParsed, mockParseDelay, pickDownloadUrl } from '../../utils';
import EngineStatus from '../EngineStatus';
import PlaylistHero from './components/PlaylistHero';
import TrackList from './components/TrackList';
import styles from './index.module.less';

interface PlaylistResultProps {
  data: PlaylistInfo;
}

/**
 * 歌单解析结果
 */
const PlaylistResult: React.FC<PlaylistResultProps> = ({ data }) => {
  const { searchParams } = useSearchParams();
  const { config } = useConfig();
  const downloadConcurrency = config?.downloadConcurrency ?? DEFAULT_CONFIG.downloadConcurrency;
  /** 更新歌曲完整信息 */
  const patchPlaylistTrackFullInfo = usePlaylistParseStore(
    (state) => state.patchPlaylistTrackFullInfo,
  );
  /** 合并更新单首下载信息 */
  const setTrackDownload = usePlaylistParseStore((state) => state.setTrackDownload);
  /** 清空全部下载态 */
  const clearTrackDownloads = usePlaylistParseStore((state) => state.clearTrackDownloads);
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

  const tracks = data.tracks || [];

  /** 解析曲目在完整歌单中的序号（从 1 起，不补零） */
  const resolvePlaylistIndex = (track: PlaylistMusicInfo): number | undefined => {
    const list = usePlaylistParseStore.getState().playlistHasResult?.tracks || tracks;
    if (!track.id) return undefined;
    const i = list.findIndex((item) => item.id === track.id);
    return i >= 0 ? i + 1 : undefined;
  };

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

  /**
   * 将 downloadSong 的阶段进度写入 store（ratio 0–1 → percent）
   * @example
   * reportTrackDownloadProgress('id', 'downloading', 0.42)
   */
  const reportTrackDownloadProgress = (
    trackId: string,
    phase: 'downloading' | 'decrypting' | 'embedding',
    ratio: number,
  ) => {
    const progress = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
    setTrackDownload(trackId, { status: 'downloading', phase, progress, errorMsg: null });
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

      await runWithConcurrency(pending, downloadConcurrency, async (track) => {
        const ok = await parseTrack(track, true);
        if (ok) success += 1;
        else failed += 1;
      });

      return { success, failed, total: pending.length };
    },
    [parseTrack, downloadConcurrency],
  );

  /**
   * 批量解析曲目
   * @example
   * await parseTracksBatch(tracks, true);  // 强制重解析
   * await parseTracksBatch(unparsedTracks); // 仅解析未解析
   */
  const parseTracksBatch = useCallback(
    async (targetTracks: PlaylistMusicInfo[], force = false) => {
      const pending = force
        ? targetTracks.filter((track) => Boolean(track.id))
        : targetTracks.filter((track) => track.id && !isTrackParsed(track));
      let success = 0;
      let failed = 0;

      await runWithConcurrency(pending, downloadConcurrency, async (track) => {
        const ok = await parseTrack(track, true, force);
        if (ok) success += 1;
        else failed += 1;
        bumpBatchProgress(ok);
      });

      return { success, failed, total: pending.length };
    },
    [parseTrack, downloadConcurrency],
  );

  /**
   * 批量解析（曲目由子组件筛选好后传入）
   * @example
   * await handleBatchParse(filteredTracks, { force: true });
   * await handleBatchParse(unparsedTracks);
   */
  const handleBatchParse = async (
    targetTracks: PlaylistMusicInfo[],
    options?: { force?: boolean },
  ) => {
    const force = options?.force ?? false;
    setBatchProgress({ success: 0, failed: 0 });
    try {
      const { success, failed, total } = await parseTracksBatch(targetTracks, force);
      if (total === 0) {
        msgError(force ? '没有可解析的曲目' : '没有未解析的曲目');
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

    setTrackDownload(trackId, {
      status: 'downloading',
      progress: 0,
      phase: 'downloading',
      errorMsg: null,
    });
    try {
      let latest = getLatestTrack(trackId) || track;
      if (!isTrackParsed(latest)) {
        const ok = await parseTrack(latest, true);
        if (!ok) {
          setTrackDownload(trackId, { status: 'error', errorMsg: '解析失败，无法下载' });
          msgError('解析失败，无法下载');
          return;
        }
        latest = getLatestTrack(trackId) || latest;
      }

      const fullInfo = latest.fullInfo;
      if (!fullInfo) {
        setTrackDownload(trackId, { status: 'error', errorMsg: '未解析到有效歌曲信息' });
        msgError('未解析到有效歌曲信息');
        return;
      }
      const urlItem = pickDownloadUrl(fullInfo.urls);
      if (!urlItem?.url) {
        setTrackDownload(trackId, { status: 'error', errorMsg: '没有可下载的音质地址' });
        msgError('没有可下载的音质地址');
        return;
      }

      await downloadSongAudio({
        data: fullInfo,
        item: urlItem,
        embedMetadata,
        index: resolvePlaylistIndex(latest),
        onProgress: (phase, ratio) => reportTrackDownloadProgress(trackId, phase, ratio),
      });
      setTrackDownload(trackId, {
        status: 'success',
        progress: 100,
        phase: undefined,
        errorMsg: null,
      });
      msgSuccess('下载成功');
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : '下载失败';
      setTrackDownload(trackId, { status: 'error', errorMsg, phase: undefined });
      msgError(errorMsg);
    }
  };

  const handleDownloadLyric = (track: PlaylistMusicInfo, mode: 'lrc' | 'txt') => {
    const fullInfo = (getLatestTrack(track.id || '') || track).fullInfo;
    if (!fullInfo) {
      msgError('请先解析歌曲');
      return;
    }
    try {
      downloadSongLyric(fullInfo, mode, resolvePlaylistIndex(track));
      msgSuccess(mode === 'lrc' ? 'lrc 歌词已保存' : 'txt 歌词已保存');
    } catch (error) {
      msgError(error instanceof Error ? error.message : '暂无歌词可保存');
    }
  };

  /**
   * 单曲下载：已解析则直接下，否则先解析再下
   * @example
   * await downloadOneTrack(track); // true=成功
   */
  const downloadOneTrack = async (track: PlaylistMusicInfo): Promise<boolean> => {
    const trackId = track.id;
    if (!trackId) {
      bumpBatchProgress(false);
      return false;
    }

    let latest = getLatestTrack(trackId) || track;
    if (!isTrackParsed(latest)) {
      const ok = await parseTrack(latest, true);
      if (!ok) {
        setTrackDownload(trackId, { status: 'error', errorMsg: '解析失败' });
        bumpBatchProgress(false);
        return false;
      }
      latest = getLatestTrack(trackId) || latest;
    }

    const fullInfo = latest.fullInfo;
    if (!fullInfo) {
      setTrackDownload(trackId, { status: 'error', errorMsg: '未解析到有效歌曲信息' });
      bumpBatchProgress(false);
      return false;
    }
    const urlItem = pickDownloadUrl(fullInfo.urls);
    if (!urlItem?.url) {
      setTrackDownload(trackId, { status: 'error', errorMsg: '没有可下载的音质地址' });
      bumpBatchProgress(false);
      return false;
    }

    setTrackDownload(trackId, {
      status: 'downloading',
      progress: 0,
      phase: 'downloading',
      errorMsg: null,
    });
    try {
      await downloadSongAudio({
        data: fullInfo,
        item: urlItem,
        embedMetadata,
        index: resolvePlaylistIndex(latest),
        onProgress: (phase, ratio) => reportTrackDownloadProgress(trackId, phase, ratio),
      });
      setTrackDownload(trackId, {
        status: 'success',
        progress: 100,
        phase: undefined,
        errorMsg: null,
      });
      bumpBatchProgress(true);
      return true;
    } catch (error) {
      console.error(error);
      setTrackDownload(trackId, {
        status: 'error',
        errorMsg: error instanceof Error ? error.message : '下载失败',
        phase: undefined,
      });
      bumpBatchProgress(false);
      return false;
    }
  };

  /**
   * 按列表并发「解析即下载」，最多 downloadConcurrency 路
   * @example
   * const { success, failed } = await downloadTrackList(tracks);
   */
  const downloadTrackList = async (targetTracks: PlaylistMusicInfo[]) => {
    let success = 0;
    let failed = 0;

    await runWithConcurrency(targetTracks, downloadConcurrency, async (track) => {
      const ok = await downloadOneTrack(track);
      if (ok) success += 1;
      else failed += 1;
    });

    return { success, failed };
  };

  /**
   * 批量下载（曲目由子组件筛选好后传入；每首各自解析后立刻下载）
   * @example
   * await handleBatchDownload(filteredTracks, { clearStatus: true }); // 全部下载
   * await handleBatchDownload(undownloadedTracks);                    // 下载未下载的
   * await handleBatchDownload(failedTracks, { doneLabel: '重试完成' }); // 重试失败
   */
  const handleBatchDownload = async (
    targetTracks: PlaylistMusicInfo[],
    options?: { clearStatus?: boolean; doneLabel?: string },
  ) => {
    if (targetTracks.length === 0) return;
    setBatchProgress({ success: 0, failed: 0 });
    if (options?.clearStatus) clearTrackDownloads();
    try {
      const { success, failed } = await downloadTrackList(targetTracks);
      msgSuccess(`${options?.doneLabel ?? '下载完成'}：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('error', error);
    }
  };

  /**
   * 批量解析后导出歌单 JSON
   * @example
   * await handleDownloadAllJson(filteredTracks);
   */
  const handleDownloadAllJson = async (targetTracks: PlaylistMusicInfo[]) => {
    if (targetTracks.length === 0) return;

    setBatchProgress({ success: 0, failed: 0 });
    try {
      const { success, failed, total } = await parseTracksBatch(targetTracks, false);

      const trackIdSet = new Set(targetTracks.map((track) => track.id).filter(Boolean));
      const latestById = new Map(
        (usePlaylistParseStore.getState().playlistHasResult?.tracks || [])
          .filter((track) => track.id && trackIdSet.has(track.id))
          .map((track) => [track.id!, track] as const),
      );

      const list = targetTracks.map((track) => {
        const latest = (track.id && latestById.get(track.id)) || track;
        const fullInfo = latest.fullInfo;
        return {
          id: latest.id,
          title: fullInfo?.title ?? latest.title,
          artist: fullInfo?.artist ?? latest.artist,
          album: fullInfo?.album ?? latest.album,
          cover: fullInfo?.cover ?? latest.cover,
          duration: latest.duration,
          type: latest.type,
          urls: fullInfo?.urls ?? [],
          lrc: fullInfo?.lrc ?? '',
          lrcText: fullInfo?.lrcText ?? '',
        };
      });

      const playlistTitle = data.title?.trim() || '歌单';
      const safeFilename = playlistTitle.replace(/[\\/:*?"<>|]/g, '_');

      downloadAsJson(
        {
          歌单名: playlistTitle,
          list,
        },
        safeFilename,
      );

      if (total === 0) {
        msgSuccess(`JSON 已导出：共 ${list.length} 首`);
      } else {
        msgSuccess(`JSON 已导出：解析成功 ${success}，失败 ${failed}`);
      }
    } catch (error) {
      console.log('handleDownloadAllJson error', error);
      msgError(error instanceof Error ? error.message : 'JSON 导出失败');
    }
  };

  const handleDownloadAllLyrics = async (
    targetTracks: PlaylistMusicInfo[],
    mode: 'lrc' | 'txt',
  ) => {
    await ensureTracksParsed(targetTracks);
    const targetTrackIds = targetTracks.map((track) => track.id);
    const latestTracks =
      usePlaylistParseStore
        .getState()
        .playlistHasResult?.tracks.filter((track) => targetTrackIds.includes(track.id)) ||
      targetTracks;
    let success = 0;
    let failed = 0;

    for (const track of latestTracks) {
      if (!isTrackParsed(track) || !track.fullInfo) {
        failed += 1;
        continue;
      }
      try {
        downloadSongLyric(track.fullInfo, mode, resolvePlaylistIndex(track));
        success += 1;
        await mockParseDelay(166);
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
        liveSuccessCount={batchProgress.success}
        liveFailCount={batchProgress.failed}
        onBatchParse={handleBatchParse}
        onBatchDownload={handleBatchDownload}
        onDownloadAllLyrics={handleDownloadAllLyrics}
        onDownloadAllJson={handleDownloadAllJson}
        onParse={parseTrack}
        onDownload={handleDownload}
        onDownloadLyric={handleDownloadLyric}
      />
    </div>
  );
};

export default PlaylistResult;
