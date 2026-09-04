import { reqGetNeteaseSongDetail } from '@/apis';
import { SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { DEFAULT_CONFIG, useConfig, useSearchParams } from '@/hooks';
import type { NeteaseApiPrivilege, NeteaseApiSong } from '@/types/netease';
import eventBus from '@/utils/eventBus';
import { getOptions, isDebugging, isDev } from '@/utils';
import { msgError } from '@/utils/modal';
import {
  CloudDownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Pagination } from 'antd';
import classNames from 'classnames';
import { PLACEHOLDER_COVER } from '../../mock';
import { usePlaylistParseStore } from '../../store/usePlaylistParseStore';
import { formatDuration, formatNeteaseArtistNames, toHttpsUrl } from '../../utils';
import shared from '../shared.module.less';
import styles from './index.module.less';

/** 每页最多曲目数 */
const PAGE_SIZE = 50;
const DEBUGGER_MODE = isDebugging();

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
  const { neteasePreferredQuality } = config ?? {};
  const patchTrackParseInfo = usePlaylistParseStore((state) => state.patchTrackParseInfo);
  const [parsingIds, setParsingIds] = useState<Set<number>>(() => new Set());
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

  /** 全部下载（功能待实现） */
  const handleDownloadAll = () => {};

  /** 下载 JSON（功能待实现） */
  const handleDownloadAllJson = () => {};

  /** 下载未下载的（功能待实现） */
  const handleDownloadUndownloaded = () => {};

  /** 下载全部歌词（功能待实现） */
  const handleDownloadAllLyrics = (_mode: 'lrc' | 'txt') => {};

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
   * await handleParse(track, true)
   */
  const handleParse = async (track: NeteaseApiSong, force = false) => {
    if (!track.id) {
      msgError('缺少歌曲 ID，无法解析');
      return false;
    }
    if (!force && track.parseInfo) return true;
    if (!queryParams.cardSecret) {
      msgError('请先绑定卡密');
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
        return false;
      }
      const parseInfo = res.data;
      if (!parseInfo?.detail?.song?.id) {
        msgError('未解析到有效歌曲信息');
        return false;
      }
      patchTrackParseInfo(track.id, parseInfo);
      eventBus.emit('cardSecretRefresh');
      return true;
    } catch (error) {
      console.log('parseTrack error', error);
      msgError('解析失败，请稍后重试');
      return false;
    } finally {
      markParsing(track.id, false);
    }
  };

  /** 下载单曲（功能待实现） */
  const handleDownload = async (track: NeteaseApiSong) => {
    if (!track.parseInfo) return;
  };

  /** 下载单曲歌词（功能待实现） */
  const handleDownloadLyric = (_track: NeteaseApiSong, _mode: 'lrc' | 'txt') => {};

  return (
    <>
      <div className={styles['batchBar']} role='toolbar' aria-label='歌单批量操作'>
        <button
          className={classNames(shared['btn'], shared['btnPrimary'])}
          type='button'
          disabled={emptyList}
          onClick={handleDownloadAll}>
          <CloudDownloadOutlined />
          全部下载
          <span className={styles['btnCountPrimary']}>{filteredTracks.length}</span>
        </button>
        {isDev || DEBUGGER_MODE ? (
          <button
            className={classNames(shared['btn'], shared['btnGhost'])}
            type='button'
            disabled={emptyList}
            onClick={handleDownloadAllJson}>
            <CloudDownloadOutlined />
            下载JSON
            <span className={styles['btnCount']}>{filteredTracks.length}</span>
          </button>
        ) : null}
        <button
          className={classNames(shared['btn'], shared['btnGhost'])}
          type='button'
          disabled={emptyList}
          onClick={handleDownloadUndownloaded}>
          <CloudDownloadOutlined />
          下载未下载的
          <span className={styles['btnCount']}>{filteredTracks.length}</span>
        </button>
        <button
          className={classNames(shared['btn'], shared['btnGhost'])}
          type='button'
          disabled={emptyList}
          onClick={() => handleDownloadAllLyrics('lrc')}>
          <FileTextOutlined />
          下载全部 lrc 歌词 <span className={styles['btnCount']}>{filteredTracks.length}</span>
        </button>
        <button
          className={classNames(shared['btn'], shared['btnGhost'])}
          type='button'
          disabled={emptyList}
          onClick={() => handleDownloadAllLyrics('txt')}>
          <FileTextOutlined />
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

          return (
            <li key={track.id || String(track.index)} className={styles['item']}>
              <span className={styles['index']}>{String(track.index + 1).padStart(2, '0')}</span>
              <img className={styles['cover']} src={cover} alt='' />
              <div className={styles['info']}>
                <p className={styles['title']}>{track.name || '未知歌曲'}</p>
                <p className={styles['artist']}>
                  {artistName}
                  {albumName ? ` · ${albumName}` : ''}
                </p>
              </div>
              <span className={styles['duration']}>{formatDuration((track.dt || 0) / 1000)}</span>
              <div className={styles['itemActions']}>
                {track.parseInfo ? (
                  <>
                    <button
                      className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                      type='button'
                      aria-label={`重新解析歌曲 ${track.name}`}
                      disabled={parsing}
                      onClick={() => handleParse(track, true)}>
                      {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                      {parsing ? '解析中' : '重新解析'}
                    </button>
                    <button
                      className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                      type='button'
                      aria-label={`下载歌曲 ${track.name}`}
                      onClick={() => handleDownload(track)}>
                      <CloudDownloadOutlined />
                      下载
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
                    disabled={parsing}
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
