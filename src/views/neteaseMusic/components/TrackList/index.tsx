import { reqGetNeteaseSongDetail } from '@/apis';
import { SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { DEFAULT_CONFIG, useConfig, useEmbedAudioMetadata, useSearchParams } from '@/hooks';
import type {
  NeteaseApiPrivilege,
  NeteaseApiSong,
  NeteaseSongDetailData,
  ParseNeteaseSongResponseData,
} from '@/types/netease';
import eventBus from '@/utils/eventBus';
import { downloadAsJson } from '@/utils/download';
import { getOptions, isDebugging, isDev } from '@/utils';
import { msgError, msgSuccess } from '@/utils/modal';
import {
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleFilled,
  CloudDownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Pagination } from 'antd';
import classNames from 'classnames';
import { downloadNeteaseSongAudio, downloadNeteaseSongLyric, runWithConcurrency } from '../../downloadSong';
import { PLACEHOLDER_COVER } from '../../mock';
import {
  usePlaylistParseStore,
  type TrackDownloadStatus,
} from '../../store/usePlaylistParseStore';
import { formatDuration, formatNeteaseArtistNames, formatSize, sleep, toHttpsUrl } from '../../utils';
import shared from '../shared.module.less';
import styles from './index.module.less';

/** 每页最多曲目数 */
const PAGE_SIZE = 50;
const DEBUGGER_MODE = isDebugging();

type BatchAction = 'download' | 'downloadUndownloaded' | 'downloadJson' | 'lrc' | 'txt' | null;

/** 带原始序号的曲目（序号取自完整列表，筛选后仍保持） */
type IndexedTrack = NeteaseApiSong & { index: number };

/** 是否处于下载 / 写入元数据过程中 */
const isDownloadBusy = (status: TrackDownloadStatus) =>
  status === 'downloading' || status === 'embedding';

/**
 * 把单曲详情整理成下载所需结构（下载逻辑按单曲解析响应取字段）
 * @example
 * ```ts
 * toSongDownloadData(track.parseInfo);
 * ```
 */
const toSongDownloadData = (parseInfo: NeteaseSongDetailData): ParseNeteaseSongResponseData => ({
  song: parseInfo.detail?.song ?? null,
  download: parseInfo.download,
  lyric: parseInfo.lyric,
  quality: parseInfo.quality,
});

/**
 * 下载按钮文案
 * @example
 * ```ts
 * resolveDownloadLabel('embedding', 42); // '写入 42%'
 * ```
 */
const resolveDownloadLabel = (status: TrackDownloadStatus, progress: number) => {
  if (status === 'downloading') return `下载 ${progress}%`;
  if (status === 'embedding') return `写入 ${progress}%`;
  if (status === 'success') return '已完成';
  if (status === 'error') return '重试';
  return '下载';
};

/** 下载按钮图标 */
const resolveDownloadIcon = (status: TrackDownloadStatus) => {
  if (isDownloadBusy(status)) return <LoadingOutlined />;
  if (status === 'success') return <CheckOutlined />;
  return <CloudDownloadOutlined />;
};

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: PAGE_SIZE,
};

interface TrackListProps {
  tracks: NeteaseApiSong[];
  privileges?: NeteaseApiPrivilege[];
}

interface SearchParams {
  range?: [number | null, number | null];
  name?: string[];
  artist?: string[];
  album?: string[];
  pageNum: number;
  pageSize: number;
}

/**
 * 可筛选、分页的曲目列表
 * @example
 * ```tsx
 * <TrackList tracks={songs} privileges={privileges} />
 * ```
 */
const TrackList: React.FC<TrackListProps> = ({ tracks, privileges }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);
  const { searchParams: queryParams } = useSearchParams<{ cardSecret?: string }>();
  const { config } = useConfig();
  const { neteasePreferredQuality, downloadConcurrency } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  const patchTrackParseInfo = usePlaylistParseStore((state) => state.patchTrackParseInfo);
  const trackDownloadMap = usePlaylistParseStore((state) => state.trackDownloadMap);
  const setTrackDownload = usePlaylistParseStore((state) => state.setTrackDownload);
  const clearTrackDownloads = usePlaylistParseStore((state) => state.clearTrackDownloads);
  const [parsingIds, setParsingIds] = useState<Set<number>>(() => new Set());
  const [batchAction, setBatchAction] = useState<BatchAction>(null);
  const [batchProgress, setBatchProgress] = useState({ success: 0, failed: 0 });
  const { embedMetadata } = useEmbedAudioMetadata();
  const privilegeMap = useMemo(
    () => new Map((privileges || []).map((item) => [item.id, item])),
    [privileges],
  );

  /** 筛选表单选项 */
  const searchFormOptions = useMemo(
    () =>
      [
        {
          label: '歌曲名称',
          name: 'name',
          type: 'select',
          options: getOptions(tracks, 'name'),
        },
      ] as SearchFormOption[],
    [tracks],
  );

  /** 筛选表单高级筛选项 */
  const searchFormAdvancedOptions = useMemo(() => {
    const artistOptions = [
      ...new Set(
        tracks.flatMap((item) => item.ar?.map((artist) => artist.name).filter(Boolean) || []),
      ),
    ].map((value) => ({ label: value, value }));
    const albumOptions = [...new Set(tracks.map((item) => item.al?.name).filter(Boolean))].map(
      (value) => ({ label: value, value }),
    );
    return [
      {
        label: '歌手',
        name: 'artist',
        options: artistOptions,
        type: 'select',
      },
      {
        label: '专辑',
        name: 'album',
        options: albumOptions,
        type: 'select',
      },
      {
        label: '区间选择',
        name: 'range',
        type: 'rangeInput',
        placeholder: ['最小值', '最大值'],
        trigger: 'onBlur',
      },
    ] as SearchFormOption[];
  }, [tracks]);

  /** 筛选 */
  const handleSearch = (values: SearchParams) => {
    const newValues = Object.fromEntries(
      [...searchFormOptions, ...searchFormAdvancedOptions].map((option) => [
        option.name,
        values[option.name as keyof SearchParams],
      ]),
    );
    setSearchParams({ ...searchParams, ...newValues, pageNum: 1 });
  };

  /** 筛选之后的曲目（保留原始序号） */
  const filteredTracks = useMemo(() => {
    const { name, artist, album, range } = searchParams;
    return tracks
      .map((item, index) => ({ ...item, index }))
      .filter((track) => {
        if (name?.length && !name.includes(track.name)) return false;
        if (artist?.length && !track.ar?.some((item) => artist.includes(item.name))) return false;
        if (album?.length && !album.includes(track.al?.name || '')) return false;
        const [min, max] = range || [null, null];
        if (min !== null && track.index + 1 < min) return false;
        if (max !== null && track.index + 1 > max) return false;
        return true;
      });
  }, [tracks, searchParams]);

  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / PAGE_SIZE));
  const currentPage = Math.min(searchParams.pageNum, totalPages);
  const pageTracks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTracks.slice(start, start + PAGE_SIZE);
  }, [filteredTracks, currentPage]);
  const showPagination = filteredTracks.length > PAGE_SIZE;
  const emptyList = filteredTracks.length === 0;

  const handlePageChange = (nextPage: number) => {
    setSearchParams({ ...searchParams, pageNum: nextPage });
  };

  /** 当前筛选结果中尚未成功下载的曲目 */
  const undownloadedTracks = useMemo(
    () =>
      filteredTracks.filter(
        (track) => Boolean(track.id) && trackDownloadMap[track.id!]?.status !== 'success',
      ),
    [filteredTracks, trackDownloadMap],
  );
  const batchBusy = batchAction !== null;

  /** 标记解析中 */
  const markParsing = (trackId: number, active: boolean) => {
    setParsingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  };

  /**
   * 解析单曲；force=true 时即使已有 parseInfo 也会重新请求
   * @example
   * await handleParse(track)
   * await handleParse(track, true, true)
   */
  const handleParse = async (track: NeteaseApiSong, force = false, silent = false) => {
    if (!track.id) {
      if (!silent) msgError('缺少歌曲 ID，无法解析');
      return false;
    }
    if (!force && track.parseInfo) return true;
    if (!queryParams.cardSecret) {
      if (!silent) msgError('请先绑定卡密');
      return false;
    }

    markParsing(track.id, true);
    try {
      const res = await reqGetNeteaseSongDetail({
        id: String(track.id),
        cardSecret: queryParams.cardSecret,
        level: neteasePreferredQuality ?? DEFAULT_CONFIG.neteasePreferredQuality,
        getDownloadUrl: true,
      });
      if (res.code !== 200) {
        if (!silent) msgError(res.message || '解析失败');
        return false;
      }
      const parseInfo = res.data;
      if (!parseInfo?.detail?.song?.id) {
        if (!silent) msgError('未解析到有效歌曲信息');
        return false;
      }
      patchTrackParseInfo(track.id, parseInfo);
      eventBus.emit('cardSecretRefresh');
      return true;
    } catch (error) {
      console.log('parseTrack error', error);
      if (!silent) msgError('解析失败，请稍后重试');
      return false;
    } finally {
      markParsing(track.id, false);
    }
  };

  /** 读取 store 中最新的曲目（含刚写入的 parseInfo） */
  const getLatestTrack = (trackId: number) => {
    const { result } = usePlaylistParseStore.getState();
    return (
      result?.all?.songs?.find((song) => song.id === trackId) ||
      result?.detail?.playlist?.tracks?.find((song) => song.id === trackId)
    );
  };

  /**
   * 单曲下载：已解析则直接下，否则先解析再下。silent=true 时不弹单条 toast（批量用）
   * @example
   * await downloadOneTrack(track, true)
   */
  const downloadOneTrack = async (track: IndexedTrack, silent = false) => {
    const trackId = track.id;
    if (!trackId) {
      if (!silent) msgError('缺少歌曲 ID');
      return false;
    }
    if (isDownloadBusy(usePlaylistParseStore.getState().trackDownloadMap[trackId]?.status ?? 'idle')) {
      return false;
    }

    setTrackDownload(trackId, { status: 'downloading', progress: 0 });
    try {
      let latest: NeteaseApiSong = getLatestTrack(trackId) || track;
      if (!latest.parseInfo) {
        const ok = await handleParse(latest, false, silent);
        if (!ok) {
          setTrackDownload(trackId, { status: 'error', progress: 0 });
          if (!silent) msgError('解析失败，无法下载');
          return false;
        }
        latest = getLatestTrack(trackId) || latest;
      }

      const parseInfo = latest.parseInfo;
      if (!parseInfo?.detail?.song) {
        setTrackDownload(trackId, { status: 'error', progress: 0 });
        if (!silent) msgError('未解析到有效歌曲信息');
        return false;
      }

      const { download } = parseInfo;
      const url = toHttpsUrl(download?.url || '') || download?.url || '';
      if (!url) {
        setTrackDownload(trackId, { status: 'error', progress: 0 });
        if (!silent) msgError('没有可下载的音质地址');
        return false;
      }

      await downloadNeteaseSongAudio({
        data: { ...toSongDownloadData(parseInfo), song: parseInfo.detail?.song ?? latest },
        item: { url, format: download?.type || download?.encodeType || '' },
        embedMetadata,
        index: track.index + 1,
        onProgress: (phase, progress) => {
          setTrackDownload(trackId, {
            status: phase === 'embedding' ? 'embedding' : 'downloading',
            progress: Math.round(Math.min(100, Math.max(0, progress))),
          });
        },
      });
      setTrackDownload(trackId, { status: 'success', progress: 100 });
      if (!silent) msgSuccess('下载成功');
      return true;
    } catch (error) {
      console.log('download track error', error);
      setTrackDownload(trackId, { status: 'error', progress: 0 });
      if (!silent) {
        const message = error instanceof Error ? error.message : '下载失败';
        msgError(message.includes('403') ? '下载链接已失效，请重新解析' : '下载失败');
      }
      return false;
    }
  };

  /**
   * 下载单曲：未解析则先解析，再拉流并内嵌封面歌词
   * @example
   * ```ts
   * await handleDownload(track);
   * ```
   */
  const handleDownload = (track: IndexedTrack) => downloadOneTrack(track, false);

  /**
   * 下载单曲歌词（lrc 带时间轴 / txt 纯文本）
   * @example
   * handleDownloadLyric(track, 'lrc')
   */
  const handleDownloadLyric = (track: IndexedTrack, mode: 'lrc' | 'txt') => {
    const latest = (track.id && getLatestTrack(track.id)) || track;
    const parseInfo = latest.parseInfo;
    if (!parseInfo) {
      msgError('请先解析歌曲');
      return;
    }
    try {
      downloadNeteaseSongLyric(
        { ...toSongDownloadData(parseInfo), song: parseInfo.detail?.song ?? latest },
        mode,
        track.index + 1,
      );
      msgSuccess(mode === 'lrc' ? 'lrc 歌词已保存' : 'txt 歌词已保存');
    } catch (error) {
      msgError(error instanceof Error ? error.message : '暂无歌词可保存');
    }
  };

  /** 批量进度 +1 */
  const bumpBatchProgress = (ok: boolean) => {
    setBatchProgress((prev) => ({
      success: prev.success + (ok ? 1 : 0),
      failed: prev.failed + (ok ? 0 : 1),
    }));
  };

  /**
   * 按列表并发「解析即下载」，最多 downloadConcurrency 路
   * @example
   * await downloadTrackList(filteredTracks)
   */
  const downloadTrackList = async (targetTracks: IndexedTrack[]) => {
    let success = 0;
    let failed = 0;
    await runWithConcurrency(targetTracks, downloadConcurrency, async (track) => {
      const ok = await downloadOneTrack(track, true);
      if (ok) success += 1;
      else failed += 1;
      bumpBatchProgress(ok);
    });
    return { success, failed };
  };

  /**
   * 批量下载（每首各自解析后立刻下载）
   * @example
   * await handleBatchDownload(filteredTracks, { clearStatus: true })
   */
  const handleBatchDownload = async (
    targetTracks: IndexedTrack[],
    options?: { clearStatus?: boolean; doneLabel?: string },
  ) => {
    if (targetTracks.length === 0) return;
    if (!queryParams.cardSecret) {
      msgError('请先绑定卡密');
      return;
    }
    setBatchProgress({ success: 0, failed: 0 });
    if (options?.clearStatus) clearTrackDownloads();
    try {
      const { success, failed } = await downloadTrackList(targetTracks);
      msgSuccess(`${options?.doneLabel ?? '下载完成'}：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('batch download error', error);
    }
  };

  /** 全部下载 */
  const handleDownloadAll = async () => {
    if (batchBusy) return;
    setBatchAction('download');
    try {
      await handleBatchDownload(filteredTracks, { clearStatus: true });
    } finally {
      setBatchAction(null);
    }
  };

  /** 仅下载当前筛选结果中尚未成功下载的曲目 */
  const handleDownloadUndownloaded = async () => {
    if (batchBusy) return;
    setBatchAction('downloadUndownloaded');
    try {
      await handleBatchDownload(undownloadedTracks);
    } finally {
      setBatchAction(null);
    }
  };

  /**
   * 批量解析后导出歌单 JSON
   * @example
   * await handleDownloadAllJson()
   */
  const handleDownloadAllJson = async () => {
    if (batchBusy || filteredTracks.length === 0) return;
    if (!queryParams.cardSecret) {
      msgError('请先绑定卡密');
      return;
    }
    setBatchAction('downloadJson');
    setBatchProgress({ success: 0, failed: 0 });
    try {
      const pending = filteredTracks.filter((track) => track.id && !track.parseInfo);
      await runWithConcurrency(pending, downloadConcurrency, async (track) => {
        const latest = getLatestTrack(track.id) || track;
        if (latest.parseInfo) {
          bumpBatchProgress(true);
          return;
        }
        bumpBatchProgress(await handleParse(latest, false, true));
      });

      const list = filteredTracks.map((track) => {
        const latest = (track.id && getLatestTrack(track.id)) || track;
        const parseInfo = latest.parseInfo;
        const song = parseInfo?.detail?.song ?? latest;
        return {
          id: song.id,
          name: song.name,
          artist: formatNeteaseArtistNames(song.ar),
          album: song.al?.name ?? '',
          cover: toHttpsUrl(song.al?.picUrl) || song.al?.picUrl || '',
          duration: song.dt,
          download: parseInfo?.download ?? null,
          lyric: parseInfo?.lyric ?? null,
          quality: parseInfo?.quality ?? null,
        };
      });

      const playlistTitle =
        usePlaylistParseStore.getState().result?.detail?.playlist?.name?.trim() || '网易云歌单';
      downloadAsJson({ 歌单名: playlistTitle, list }, playlistTitle.replace(/[\\/:*?"<>|]/g, '_'));

      const parsedCount = list.filter((item) => item.download || item.lyric).length;
      msgSuccess(
        pending.length === 0
          ? `JSON 已导出：共 ${list.length} 首`
          : `JSON 已导出：解析成功 ${parsedCount}，失败 ${list.length - parsedCount}`,
      );
    } catch (error) {
      console.log('handleDownloadAllJson error', error);
      msgError(error instanceof Error ? error.message : 'JSON 导出失败');
    } finally {
      setBatchAction(null);
    }
  };

  /**
   * 批量下载歌词：解析一手、下载一手
   * @example
   * await handleDownloadAllLyrics('lrc')
   */
  const handleDownloadAllLyrics = async (mode: 'lrc' | 'txt') => {
    if (batchBusy || filteredTracks.length === 0) return;
    if (!queryParams.cardSecret) {
      msgError('请先绑定卡密');
      return;
    }
    setBatchAction(mode);
    setBatchProgress({ success: 0, failed: 0 });
    try {
      let success = 0;
      let failed = 0;
      await runWithConcurrency(filteredTracks, downloadConcurrency, async (track) => {
        const trackId = track.id;
        if (!trackId) {
          failed += 1;
          bumpBatchProgress(false);
          return;
        }
        let latest: NeteaseApiSong = getLatestTrack(trackId) || track;
        if (!latest.parseInfo) {
          const ok = await handleParse(latest, false, true);
          if (!ok) {
            failed += 1;
            bumpBatchProgress(false);
            return;
          }
          latest = getLatestTrack(trackId) || latest;
        }
        const parseInfo = latest.parseInfo;
        if (!parseInfo) {
          failed += 1;
          bumpBatchProgress(false);
          return;
        }
        try {
          downloadNeteaseSongLyric(
            { ...toSongDownloadData(parseInfo), song: parseInfo.detail?.song ?? latest },
            mode,
            track.index + 1,
          );
          success += 1;
          bumpBatchProgress(true);
          await sleep(166);
        } catch {
          failed += 1;
          bumpBatchProgress(false);
        }
      });
      msgSuccess(`${mode === 'lrc' ? 'lrc' : 'txt'} 下载完成：成功 ${success}，失败 ${failed}`);
    } catch (error) {
      console.log('handleDownloadAllLyrics error', error);
    } finally {
      setBatchAction(null);
    }
  };

  return (
    <>
      <div className={styles['batchBar']} role='toolbar' aria-label='歌单批量操作'>
        <button
          className={classNames(shared['btn'], shared['btnPrimary'])}
          type='button'
          disabled={emptyList || batchBusy}
          onClick={handleDownloadAll}>
          {batchAction === 'download' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
          全部下载
          {batchAction === 'download' ? (
            <>
              <span className={classNames(styles['btnCountPrimary'], styles['btnCountOk'])}>
                {batchProgress.success}
              </span>
              <span className={classNames(styles['btnCountPrimary'], styles['btnCountFail'])}>
                {batchProgress.failed}
              </span>
            </>
          ) : (
            <span className={styles['btnCountPrimary']}>{filteredTracks.length}</span>
          )}
        </button>
        {isDev || DEBUGGER_MODE ? (
          <button
            className={classNames(shared['btn'], shared['btnGhost'])}
            type='button'
            disabled={emptyList || batchBusy}
            onClick={handleDownloadAllJson}>
            {batchAction === 'downloadJson' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
            下载JSON
            {batchAction === 'downloadJson' ? (
              <>
                <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
                  {batchProgress.success}
                </span>
                <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
                  {batchProgress.failed}
                </span>
              </>
            ) : (
              <span className={styles['btnCount']}>{filteredTracks.length}</span>
            )}
          </button>
        ) : null}
        <button
          className={classNames(shared['btn'], shared['btnGhost'])}
          type='button'
          disabled={undownloadedTracks.length === 0 || batchBusy}
          onClick={handleDownloadUndownloaded}>
          {batchAction === 'downloadUndownloaded' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
          下载未下载的
          {batchAction === 'downloadUndownloaded' ? (
            <>
              <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
                {batchProgress.success}
              </span>
              <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
                {batchProgress.failed}
              </span>
            </>
          ) : (
            <span className={styles['btnCount']}>{undownloadedTracks.length}</span>
          )}
        </button>
        <button
          className={classNames(shared['btn'], shared['btnGhost'])}
          type='button'
          disabled={emptyList || batchBusy}
          onClick={() => handleDownloadAllLyrics('lrc')}>
          {batchAction === 'lrc' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 lrc 歌词{' '}
          <span className={styles['btnCount']}>{filteredTracks.length}</span>
        </button>
        <button
          className={classNames(shared['btn'], shared['btnGhost'])}
          type='button'
          disabled={emptyList || batchBusy}
          onClick={() => handleDownloadAllLyrics('txt')}>
          {batchAction === 'txt' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 txt 歌词{' '}
          <span className={styles['btnCount']}>{filteredTracks.length}</span>
        </button>
      </div>

      <div className={styles['toolbar']}>
        <div className={styles['countRow']}>
          <span className={styles['count']}>共 {filteredTracks.length} 首</span>
          {showPagination ? (
            <div className={styles['pageNav']} role='group' aria-label='曲目翻页'>
              <button
                className={classNames(
                  shared['btn'],
                  shared['btnGhost'],
                  shared['btnSm'],
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
                  shared['btn'],
                  shared['btnGhost'],
                  shared['btnSm'],
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
        </div>
      </div>

      <div className={styles['filterBar']} aria-label='曲目筛选'>
        <SearchForm
          options={searchFormOptions}
          advancedOptions={searchFormAdvancedOptions}
          onValuesChange={(_, allValues) => handleSearch(allValues)}
          showSearchButton={false}
          advancedSearchText='更多筛选'
          onSearch={handleSearch}
        />
      </div>

      <ul className={styles['list']}>
        {pageTracks.map((track) => {
          const artistName = formatNeteaseArtistNames(track.ar) || '未知艺人';
          const albumName = track.al?.name || '';
          const cover = toHttpsUrl(track.al?.picUrl) || track.al?.picUrl || PLACEHOLDER_COVER;
          const parsing = Boolean(track.id && parsingIds.has(track.id));
          const downloadSize = track.parseInfo?.download?.size;
          const downloadStatus = trackDownloadMap[track.id]?.status ?? 'idle';
          const downloadProgress = trackDownloadMap[track.id]?.progress ?? 0;
          const downloading = isDownloadBusy(downloadStatus);
          const downloadProgressText = (() => {
            if (!downloading) return null;
            if (downloadStatus === 'embedding') return `写入 ${downloadProgress}%`;
            return `${downloadProgress}%`;
          })();

          return (
            <li
              key={track.id || String(track.index)}
              className={classNames(styles['item'], {
                [styles['itemProgress']]: downloading,
                [styles['itemDone']]: downloadStatus === 'success',
                [styles['itemError']]: downloadStatus === 'error',
              })}
              style={
                downloading
                  ? ({ '--progress': `${downloadProgress}%` } as React.CSSProperties)
                  : undefined
              }>
              <span className={styles['index']}>{String(track.index + 1).padStart(2, '0')}</span>
              <img className={styles['cover']} src={cover} alt='' />
              <div className={styles['info']}>
                <p className={styles['title']}>{track.name || '未知歌曲'}</p>
                <p className={styles['artist']}>
                  <span className={styles['artistName']}>
                    {artistName}
                    {albumName ? ` · ${albumName}` : ''}
                  </span>
                  {downloading ? (
                    <span className={styles['downloadMarkLoading']} aria-label='下载中'>
                      <LoadingOutlined />
                      {downloadProgressText ? (
                        <span className={styles['downloadProgressText']}>{downloadProgressText}</span>
                      ) : null}
                    </span>
                  ) : null}
                  {!downloading && downloadStatus === 'success' ? (
                    <CheckCircleFilled className={styles['downloadMarkOk']} aria-label='下载成功' />
                  ) : null}
                  {!downloading && downloadStatus === 'error' ? (
                    <CloseCircleFilled className={styles['downloadMarkFail']} aria-label='下载失败' />
                  ) : null}
                </p>
              </div>
              <div className={styles['metaCol']}>
                <span className={styles['duration']}>{formatDuration((track.dt || 0) / 1000)}</span>
                {downloadSize ? (
                  <span className={styles['size']} title='解析到的文件大小'>
                    {formatSize(downloadSize)}
                  </span>
                ) : null}
              </div>
              <div className={styles['itemActions']}>
                {track.parseInfo ? (
                  <>
                    <button
                      className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                      type='button'
                      aria-label={`重新解析歌曲 ${track.name}`}
                      disabled={parsing || batchBusy}
                      onClick={() => handleParse(track, true)}>
                      {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                      {parsing ? '解析中' : '重新解析'}
                    </button>
                    <button
                      className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                      type='button'
                      aria-label={`下载歌曲 ${track.name}`}
                      disabled={downloading || batchBusy}
                      onClick={() => handleDownload(track)}>
                      {resolveDownloadIcon(downloadStatus)}
                      {resolveDownloadLabel(downloadStatus, downloadProgress)}
                    </button>
                    <button
                      className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                      type='button'
                      aria-label={`下载歌词 lrc ${track.name}`}
                      onClick={() => handleDownloadLyric(track, 'lrc')}>
                      <FileTextOutlined />
                      lrc
                    </button>
                    <button
                      className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                      type='button'
                      aria-label={`下载歌词 txt ${track.name}`}
                      onClick={() => handleDownloadLyric(track, 'txt')}>
                      <FileTextOutlined />
                      txt
                    </button>
                  </>
                ) : (
                  <button
                    className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                    type='button'
                    aria-label={`解析歌曲 ${track.name}`}
                    disabled={parsing || batchBusy}
                    onClick={() => handleParse(track)}>
                    {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                    {parsing ? '解析中' : '解析'}
                  </button>
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
