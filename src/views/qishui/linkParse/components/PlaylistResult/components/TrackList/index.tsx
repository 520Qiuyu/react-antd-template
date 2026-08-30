import { SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import type { PlaylistMusicInfo } from '@/types/qishui';
import { getOptions, isDebugging, isDev } from '@/utils';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudDownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Pagination } from 'antd';
import classNames from 'classnames';
import { usePlaylistParseStore } from '../../../../store';
import { formatDuration, isTrackParsed } from '../../../../utils';
import sharedStyles from '../shared.module.less';
import styles from './index.module.less';

/** 每页最多曲目数 */
const PAGE_SIZE = 50;
const DEBUGGER_MODE = isDebugging();

const DOWNLOAD_PHASE_TEXT: Record<string, string> = {
  downloading: '下载中',
  decrypting: '解密中',
  embedding: '元信息写入中',
};

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: PAGE_SIZE,
};
const TrackList: React.FC<TrackListProps> = ({
  tracks,
  parsingIds,
  liveSuccessCount,
  liveFailCount,
  onBatchParse,
  onBatchDownload,
  onDownloadAllLyrics,
  onDownloadAllJson,
  onParse,
  onDownload,
  onDownloadLyric,
}) => {
  const trackDownloadMap = usePlaylistParseStore((state) => state.trackDownloadMap);
  // REGION ========================= 筛选 =========================
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);
  /** 筛选表单选项 */
  const searchFormOptions = useMemo(
    () =>
      [
        // 歌曲名称
        {
          label: '歌曲名称',
          name: 'title',
          type: 'select',
          options: getOptions(tracks, 'title'),
        },
      ] as SearchFormOption[],
    [tracks],
  );
  /** 筛选表单高级筛选项 */
  const searchFormAdvancedOptions = useMemo(
    () =>
      [
        // 类型
        {
          label: '类型',
          name: 'type',
          type: 'select',
          options: [
            { label: '歌曲', value: 'track' },
            { label: '视频', value: 'video' },
          ].filter((item) => tracks.some((track) => track.type === item.value)),
        },
        {
          label: '歌手',
          name: 'artist',
          options: getOptions(tracks, 'artist'),
          type: 'select',
        },
        // 专辑
        {
          label: '专辑',
          name: 'album',
          options: getOptions(tracks, 'album'),
          type: 'select',
        },
        // 区间选择
        {
          label: '区间选择',
          name: 'range',
          type: 'rangeInput',
          placeholder: ['最小值', '最大值'],
          trigger: 'onBlur',
        },
        // 是否解析
        {
          label: '是否解析',
          name: 'isParsed',
          type: 'select',
          options: [
            { label: '已解析', value: true },
            { label: '未解析', value: false },
          ],
          inputProps: {
            mode: undefined,
          },
        },
        // 是否下载
        {
          label: '是否下载',
          name: 'isDownloaded',
          type: 'select',
          options: [
            { label: '已下载', value: true },
            { label: '未下载', value: false },
          ],
          inputProps: {
            mode: undefined,
          },
        },
      ] as SearchFormOption[],
    [tracks],
  );
  /** 筛选 */
  const handleSearch = (values: SearchParams) => {
    const newValues = Object.fromEntries(
      [...searchFormOptions, ...searchFormAdvancedOptions].map((option) => [
        option.name,
        values[option.name],
      ]),
    );
    setSearchParams({ ...searchParams, ...newValues, pageNum: 1 });
  };

  /** 筛选之后的音乐 */
  const filteredTracks = useMemo(() => {
    const { title, type, artist, album, isParsed, isDownloaded, range } = searchParams;
    return tracks
      ?.map((i, index) => ({ ...i, index }))
      .filter((track) => {
        if (title?.length && !title.includes(track.title!)) return false;
        if (type?.length && !type.includes(track.type!)) return false;
        if (artist?.length && !artist.includes(track.artist!)) return false;
        if (album?.length && !album.includes(track.album!)) return false;
        // 区间选择列表数据
        const [min, max] = range || [null, null];
        if (min !== null && track.index + 1 < min) return false;
        if (max !== null && track.index + 1 > max) return false;
        if (isParsed !== undefined && !!track.fullInfo?.urls?.length !== isParsed) return false;
        if (
          isDownloaded !== undefined &&
          (track.id ? trackDownloadMap[track.id]?.status === 'success' : false) !== isDownloaded
        )
          return false;
        return true;
      });
  }, [tracks, searchParams, trackDownloadMap]);
  // ENDREGION ========================= 筛选 =========================

  /** 当前筛选结果中尚未解析的曲目 */
  const unparsedTracks = useMemo(
    () => filteredTracks.filter((track) => Boolean(track.id) && !isTrackParsed(track)),
    [filteredTracks],
  );
  /** 当前筛选结果中尚未成功下载的曲目 */
  const undownloadedTracks = useMemo(
    () =>
      filteredTracks.filter(
        (track) => Boolean(track.id) && trackDownloadMap[track.id!]?.status !== 'success',
      ),
    [filteredTracks, trackDownloadMap],
  );

  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / PAGE_SIZE));
  const currentPage = Math.min(searchParams.pageNum, totalPages);
  const pageTracks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTracks.slice(start, start + PAGE_SIZE);
  }, [filteredTracks, currentPage]);
  const pageOffset = (currentPage - 1) * PAGE_SIZE;

  const [batchAction, setBatchAction] = useState<BatchAction>(null);
  const { downloadSuccessCount, downloadFailCount } = useMemo(() => {
    let success = 0;
    let failed = 0;
    for (const info of Object.values(trackDownloadMap)) {
      if (info.status === 'success') success += 1;
      else if (info.status === 'error') failed += 1;
    }
    return { downloadSuccessCount: success, downloadFailCount: failed };
  }, [trackDownloadMap]);

  /** 全部下载 */
  const handleDownloadAll = async () => {
    if (batchAction) return;
    setBatchAction('download');
    try {
      await onBatchDownload(filteredTracks, { clearStatus: true });
    } finally {
      setBatchAction(null);
    }
  };
  /** 仅下载当前筛选结果中尚未成功下载的曲目 */
  const handleDownloadUndownloaded = async () => {
    if (batchAction) return;
    setBatchAction('downloadUndownloaded');
    try {
      await onBatchDownload(undownloadedTracks);
    } finally {
      setBatchAction(null);
    }
  };
  /** 重试下载失败歌曲 */
  const handleRetryFailedDownloads = async () => {
    if (batchAction) return;
    setBatchAction('retry');
    try {
      await onBatchDownload(
        filteredTracks?.filter(
          (track) => track.id && trackDownloadMap[track.id]?.status === 'error',
        ) || [],
        { doneLabel: '重试完成' },
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
      await onDownloadAllLyrics(filteredTracks, mode);
    } finally {
      setBatchAction(null);
    }
  };
  /** 全部解析后下载歌单 JSON */
  const handleDownloadAllJson = async () => {
    if (batchAction) return;
    setBatchAction('downloadJson');
    try {
      await onDownloadAllJson(filteredTracks);
    } finally {
      setBatchAction(null);
    }
  };

  const handlePageChange = (nextPage: number) => {
    setSearchParams({ ...searchParams, pageNum: nextPage });
  };

  // 状态
  const isParseBatch =
    batchAction === 'parse' || batchAction === 'parseUnparsed' || batchAction === 'downloadJson';
  const isDownloadBatch =
    batchAction === 'download' || batchAction === 'downloadUndownloaded' || batchAction === 'retry';
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
  const showDownloadLive = batchAction === 'download' || batchAction === 'retry';
  const showDownloadUndownloadedLive = batchAction === 'downloadUndownloaded';
  const showDownloadJsonLive = batchAction === 'downloadJson';
  const showPagination = filteredTracks.length > PAGE_SIZE;

  return (
    <>
      <div className={styles['batchBar']} role='toolbar' aria-label='歌单批量操作'>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnPrimary'])}
          type='button'
          disabled={filteredTracks.length === 0 || batchBusy}
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
            <span className={styles['btnCountPrimary']}>{filteredTracks.length}</span>
          )}
        </button>
        {isDev || DEBUGGER_MODE ? (
          <button
            className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
            type='button'
            disabled={filteredTracks.length === 0 || batchBusy}
            onClick={handleDownloadAllJson}>
            {batchAction === 'downloadJson' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
            下载JSON
            {showDownloadJsonLive ? (
              <>
                <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
                  {liveSuccessCount}
                </span>
                <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
                  {liveFailCount}
                </span>
              </>
            ) : (
              <span className={styles['btnCount']}>{filteredTracks.length}</span>
            )}
          </button>
        ) : null}
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={undownloadedTracks.length === 0 || batchBusy}
          onClick={handleDownloadUndownloaded}>
          {batchAction === 'downloadUndownloaded' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
          下载未下载的
          {showDownloadUndownloadedLive ? (
            <>
              <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
                {liveSuccessCount}
              </span>
              <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
                {liveFailCount}
              </span>
            </>
          ) : (
            <span className={styles['btnCount']}>{undownloadedTracks.length}</span>
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
          下载全部 lrc 歌词 <span className={styles['btnCount']}>{filteredTracks.length}</span>
        </button>
        <button
          className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
          type='button'
          disabled={tracks.length === 0 || batchBusy}
          onClick={() => handleDownloadAllLyrics('txt')}>
          {batchAction === 'txt' ? <LoadingOutlined /> : <FileTextOutlined />}
          下载全部 txt 歌词 <span className={styles['btnCount']}>{filteredTracks.length}</span>
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
      </div>
      {/* 筛选表单 */}
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
          const globalIndex = track.index;
          const key = track.id || String(globalIndex);
          const parsed = isTrackParsed(track);
          const hasPlayUrl = Boolean(track.fullInfo?.urls?.some((item) => item.url));
          const noPlayUrl = parsed && !hasPlayUrl;
          const parsing = Boolean(track.id && parsingIds.has(track.id));
          const downloadInfo = track.id ? trackDownloadMap[track.id] : undefined;
          const downloading = downloadInfo?.status === 'downloading';
          const downloadStatus = downloadInfo?.status;
          const downloadProgressText = (() => {
            if (!downloading) return null;
            const percent = downloadInfo?.progress ?? 0;
            const phase = downloadInfo?.phase;
            if (!phase || phase === 'downloading') return `${percent}%`;
            const phaseLabel = DOWNLOAD_PHASE_TEXT[phase] || '处理中';
            return phase === 'embedding' ? `${phaseLabel} ${percent}%` : phaseLabel;
          })();

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
                    <span className={styles['downloadMarkLoading']} aria-label='下载中'>
                      <LoadingOutlined />
                      {downloadProgressText ? (
                        <span className={styles['downloadProgressText']}>
                          {downloadProgressText}
                        </span>
                      ) : null}
                    </span>
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
                        noPlayUrl
                          ? `无播放地址，无法下载 ${track.title}`
                          : `下载歌曲 ${track.title}`
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

export type BatchAction =
  | 'parse'
  | 'parseUnparsed'
  | 'download'
  | 'downloadUndownloaded'
  | 'downloadJson'
  | 'retry'
  | 'lrc'
  | 'txt'
  | null;

interface TrackListProps {
  tracks: PlaylistMusicInfo[];
  parsingIds: Set<string>;
  /** 进行中实时成功数（解析 / 下载） */
  liveSuccessCount: number;
  /** 进行中实时失败数（解析 / 下载） */
  liveFailCount: number;
  /**
   * 批量解析
   * @example
   * onBatchParse(tracks, { force: true }); // 全部解析
   * onBatchParse(unparsedTracks);          // 仅未解析
   */
  onBatchParse: (tracks: PlaylistMusicInfo[], options?: { force?: boolean }) => Promise<void>;
  /**
   * 批量下载
   * @example
   * onBatchDownload(tracks, { clearStatus: true });           // 全部下载
   * onBatchDownload(undownloadedTracks);                      // 下载未下载的
   * onBatchDownload(failedTracks, { doneLabel: '重试完成' }); // 重试失败
   */
  onBatchDownload: (
    tracks: PlaylistMusicInfo[],
    options?: { clearStatus?: boolean; doneLabel?: string },
  ) => Promise<void>;
  onDownloadAllLyrics: (tracks: PlaylistMusicInfo[], mode: 'lrc' | 'txt') => Promise<void>;
  /**
   * 批量解析后下载歌单 JSON
   * @example
   * onDownloadAllJson(filteredTracks);
   */
  onDownloadAllJson: (tracks: PlaylistMusicInfo[]) => Promise<void>;
  onParse: (track: PlaylistMusicInfo, silent?: boolean, force?: boolean) => void;
  onDownload: (track: PlaylistMusicInfo) => void;
  onDownloadLyric: (track: PlaylistMusicInfo, mode: 'lrc' | 'txt') => void;
}

interface SearchParams {
  range?: [number | null, number | null];
  title?: string[];
  type?: string[];
  artist?: string[];
  album?: string[];
  isParsed?: boolean;
  isDownloaded?: boolean;
  pageNum: number;
  pageSize: number;
}
