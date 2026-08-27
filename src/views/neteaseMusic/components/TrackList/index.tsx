import { SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { getOptions, isDebugging, isDev } from '@/utils';
import {
  CloudDownloadOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Pagination } from 'antd';
import classNames from 'classnames';
import type { NeteaseTrack } from '../../types';
import { formatDuration } from '../../utils';
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
  tracks: NeteaseTrack[];
}

interface SearchParams {
  range?: [number | null, number | null];
  title?: string[];
  artist?: string[];
  album?: string[];
  pageNum: number;
  pageSize: number;
}

/**
 * 可筛选、分页的曲目列表
 * @example
 * ```tsx
 * <TrackList tracks={playlist.tracks} />
 * ```
 */
const TrackList: React.FC<TrackListProps> = ({ tracks }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);

  /** 筛选表单选项 */
  const searchFormOptions = useMemo(
    () =>
      [
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
        {
          label: '歌手',
          name: 'artist',
          options: getOptions(tracks, 'artist'),
          type: 'select',
        },
        {
          label: '专辑',
          name: 'album',
          options: getOptions(tracks, 'album'),
          type: 'select',
        },
        {
          label: '区间选择',
          name: 'range',
          type: 'rangeInput',
          placeholder: ['最小值', '最大值'],
          trigger: 'onBlur',
        },
      ] as SearchFormOption[],
    [tracks],
  );

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
    const { title, artist, album, range } = searchParams;
    return tracks
      .map((item, index) => ({ ...item, index }))
      .filter((track) => {
        if (title?.length && !title.includes(track.title)) return false;
        if (artist?.length && !artist.includes(track.artist)) return false;
        if (album?.length && !album.includes(track.album)) return false;
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

  /** 解析单曲（功能待实现） */
  const handleParse = (_track: NeteaseTrack) => {};

  /** 下载单曲（功能待实现） */
  const handleDownload = (_track: NeteaseTrack) => {};

  /** 下载单曲歌词（功能待实现） */
  const handleDownloadLyric = (_track: NeteaseTrack, _mode: 'lrc' | 'txt') => {};

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
        {pageTracks.map((track) => (
          <li key={track.id || String(track.index)} className={styles['item']}>
            <span className={styles['index']}>{String(track.index + 1).padStart(2, '0')}</span>
            <img className={styles['cover']} src={track.cover} alt='' />
            <div className={styles['info']}>
              <p className={styles['title']}>{track.title || '未知歌曲'}</p>
              <p className={styles['artist']}>
                {track.artist || '未知艺人'}
                {track.album ? ` · ${track.album}` : ''}
              </p>
            </div>
            <span className={styles['duration']}>{formatDuration(track.duration || 0)}</span>
            <div className={styles['itemActions']}>
              {track.isPreviewOnly ? (
                <span className={styles['previewTag']}>试听 {track.previewDuration || 30}s</span>
              ) : null}
              <button
                className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                type='button'
                aria-label={`解析歌曲 ${track.title}`}
                onClick={() => handleParse(track)}>
                <ThunderboltOutlined />
                解析
              </button>
              <button
                className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                type='button'
                aria-label={`下载歌曲 ${track.title}`}
                onClick={() => handleDownload(track)}>
                <CloudDownloadOutlined />
                下载
              </button>
              <button
                className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                type='button'
                aria-label={`下载歌词 lrc ${track.title}`}
                onClick={() => handleDownloadLyric(track, 'lrc')}>
                <FileTextOutlined />
                lrc
              </button>
              <button
                className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                type='button'
                aria-label={`下载歌词 txt ${track.title}`}
                onClick={() => handleDownloadLyric(track, 'txt')}>
                <FileTextOutlined />
                txt
              </button>
            </div>
          </li>
        ))}
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
