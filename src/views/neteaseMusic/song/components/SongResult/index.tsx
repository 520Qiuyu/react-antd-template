import { reqGetNeteaseSongDownload } from '@/apis';
import { useEmbedAudioMetadata, useSearchParams } from '@/hooks';
import type {
  NeteaseSongDownloadData,
  NeteaseSongQualityItem,
  ParseNeteaseSongResponseData,
  ParseNeteaseSongUrl,
} from '@/types/netease';
import copy from '@/utils/copy';
import { msgError, msgSuccess } from '@/utils/modal';
import { useSongParseStore } from '@/views/neteaseMusic/store/useSongParseStore';
import {
  CheckOutlined,
  CloudDownloadOutlined,
  CopyOutlined,
  FileTextOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import shared from '../../../components/shared.module.less';
import { downloadNeteaseSongAudio } from '../../../downloadSong';
import { PLACEHOLDER_COVER } from '../../../mock';
import type { NeteaseQualitySlotRow } from '../../../utils';
import {
  formatBitrate,
  formatNeteaseArtistNames,
  formatSampleRate,
  formatSize,
  listNeteaseQualitySlots,
  qualityLabel,
  toHttpsUrl,
} from '../../../utils';
import type { SearchParams } from '../..';
import styles from './index.module.less';

interface SongResultProps {
  data: ParseNeteaseSongResponseData;
}

/**
 * 单曲解析结果卡片
 * @example
 * ```tsx
 * <SongResult data={result} />
 * ```
 */
const SongResult: React.FC<SongResultProps> = ({ data }) => {
  const [copyIdDone, setCopyIdDone] = useState(false);
  const [copyLrcDone, setCopyLrcDone] = useState(false);
  const song = data.song;
  const cover = toHttpsUrl(song?.al?.picUrl) || song?.al?.picUrl || PLACEHOLDER_COVER;
  const artistName = formatNeteaseArtistNames(song?.ar) || '未知歌手';
  const qualityCount = listNeteaseQualitySlots(data.quality).length;

  const handleCopyId = async () => {
    if (!song?.id) return;
    try {
      await copy(String(song.id));
      setCopyIdDone(true);
      msgSuccess('已复制歌曲 ID');
      setTimeout(() => setCopyIdDone(false), 1400);
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  const handleCopyLrc = async () => {
    const text = data.lyric?.lrc || data.lyric?.lrcText || '';
    if (!text) return;
    try {
      await copy(text);
      setCopyLrcDone(true);
      msgSuccess('已复制歌词');
      setTimeout(() => setCopyLrcDone(false), 1400);
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  return (
    <>
      <article className={styles['songCard']}>
        <div className={styles['coverWrap']}>
          <div className={styles['coverGlow']} aria-hidden='true' />
          <img className={styles['cover']} src={cover} alt='专辑封面' />
        </div>
        <div className={styles['meta']}>
          <span className={styles['album']}>{song?.al?.name || '未知专辑'}</span>
          <h3 className={styles['title']} title={song?.name || '未知歌曲'}>
            {song?.name || '未知歌曲'}
          </h3>
          <div className={styles['artist']}>
            <span>{artistName}</span>
          </div>
          <code className={styles['trackId']}>{song?.id || '—'}</code>
          <div className={styles['actions']}>
            <button
              className={classNames(shared['btn'], shared['btnPrimary'], shared['btnSm'])}
              type='button'
              aria-label='复制歌曲 ID'
              onClick={handleCopyId}>
              {copyIdDone ? <CheckOutlined /> : <CopyOutlined />}
              {copyIdDone ? '已复制' : '复制 ID'}
            </button>
            <button
              className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
              type='button'
              aria-label='复制歌词'
              onClick={handleCopyLrc}>
              {copyLrcDone ? <CheckOutlined /> : <FileTextOutlined />}
              {copyLrcDone ? '已复制' : '复制歌词'}
            </button>
          </div>
        </div>
      </article>

      <div className={styles['infoGrid']}>
        {[
          ['艺人', artistName],
          ['专辑', song?.al?.name || '—'],
          ['音质数', `${qualityCount} 档`],
        ].map(([label, value]) => (
          <div key={label} className={styles['infoChip']}>
            <span className={styles['infoLabel']}>{label}</span>
            <span className={styles['infoValue']}>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
};

type QualityDownload = NeteaseSongDownloadData | ParseNeteaseSongUrl;

/**
 * 拼接音质元信息
 * @example
 * formatQualityMeta(item, download) // => '320 kbps · 44.1 kHz · MP3 · 5.2 MB'
 */
const formatQualityMeta = (item: NeteaseSongQualityItem, download?: QualityDownload | null) => {
  const format = download && 'encodeType' in download ? download.encodeType : undefined;
  const parts = [
    formatBitrate(download && 'br' in download ? download.br : item.br),
    formatSampleRate(download && 'sr' in download ? download.sr : item.sr),
    (download?.type || format || item.it || '').toUpperCase(),
    download?.size || item.size ? formatSize(download?.size || item.size) : '',
  ].filter(Boolean);
  return parts.join(' · ') || '—';
};

/**
 * 取当前档位已解析到的下载信息
 * @example
 * resolveQualityDownload(row, downloads, result.download)
 */
const resolveQualityDownload = (
  row: NeteaseQualitySlotRow,
  downloads: Record<string, NeteaseSongDownloadData>,
  initial?: ParseNeteaseSongUrl | null,
): QualityDownload | undefined => {
  if (downloads[row.key]?.url) return downloads[row.key];
  if (!initial?.url || initial.level !== row.level) return undefined;
  const encodeType = initial.encodeType || initial.type || '';
  if (row.item.it && encodeType && row.item.it.toLowerCase() !== encodeType.toLowerCase()) {
    return undefined;
  }
  return initial;
};

/**
 * 音质列表
 * @example
 * ```tsx
 * <SongQualityList />
 * ```
 */
export const SongQualityList: React.FC = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  const { result, downloads, setDownload } = useSongParseStore();
  const [parsingIds, setParsingIds] = useState<string[]>([]);
  const [downloadStates, setDownloadStates] = useState<
    Record<
      string,
      { progress: number; status: 'idle' | 'downloading' | 'embedding' | 'done' | 'error' }
    >
  >({});
  const { embedMetadata } = useEmbedAudioMetadata();

  const patchDownloadState = (
    id: string,
    patch: Partial<{
      progress: number;
      status: 'idle' | 'downloading' | 'embedding' | 'done' | 'error';
    }>,
  ) => {
    setDownloadStates((prev) => ({
      ...prev,
      [id]: {
        progress: prev[id]?.progress ?? 0,
        status: prev[id]?.status ?? 'idle',
        ...patch,
      },
    }));
  };

  const handleDownload = async (
    row: NeteaseQualitySlotRow,
    download: QualityDownload | undefined,
    key: string,
  ) => {
    if (!result) return;
    const url = toHttpsUrl(download?.url || '') || download?.url || '';
    if (!url) {
      msgError('缺少播放地址');
      return;
    }
    const current = downloadStates[key]?.status;
    if (current === 'downloading' || current === 'embedding') return;

    patchDownloadState(key, { progress: 0, status: 'downloading' });
    try {
      await downloadNeteaseSongAudio({
        data: result,
        item: {
          url,
          format: download?.type || download?.encodeType || row.item.it || '',
        },
        embedMetadata,
        onProgress: (phase, progress) => {
          if (phase === 'downloading') {
            patchDownloadState(key, { progress, status: 'downloading' });
            return;
          }
          patchDownloadState(key, {
            progress: Math.round(Math.min(100, Math.max(0, progress))),
            status: 'embedding',
          });
        },
      });
      patchDownloadState(key, { progress: 100, status: 'done' });
      msgSuccess('下载成功');
    } catch (error) {
      console.log('error', error);
      patchDownloadState(key, { progress: 0, status: 'error' });
      const message = error instanceof Error ? error.message : '下载失败（可能是 CORS）';
      const is403 = message.includes('403');
      if (is403) {
        msgError('下载失败,该下载链接已失效，请重新解析');
        return;
      }
      msgError('下载失败');
    }
  };

  const handleCopyUrl = async (download: QualityDownload | undefined) => {
    const url = download?.url;
    if (!url) return;
    try {
      await copy(url);
      msgSuccess('已复制播放地址');
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  const handleParseUrl = async (row: NeteaseQualitySlotRow, key: string) => {
    const songId = result?.song?.id;
    if (!songId) return;
    if (!row.level) {
      msgError('缺少音质档位');
      return;
    }
    if (!searchParams.cardSecret) {
      msgError('请先绑定卡密');
      return;
    }
    setParsingIds((prev) => [...prev, key]);
    try {
      const res = await reqGetNeteaseSongDownload({
        id: String(songId),
        level: row.level,
        cardSecret: searchParams.cardSecret,
      });
      const download = res.data;
      if (res.code !== 200 || !download?.url) {
        msgError(res.message || '解析地址失败');
        return;
      }
      setDownload(key, download);
      msgSuccess('解析成功');
    } catch (error) {
      console.log('error', error);
      msgError('解析地址失败');
    } finally {
      setParsingIds((prev) => prev.filter((id) => id !== key));
    }
  };

  const rows = useMemo(
    () => [...listNeteaseQualitySlots(result?.quality)].reverse(),
    [result?.quality],
  );

  if (!rows.length) {
    return <p className={styles['qualityEmpty']}>暂无音质信息</p>;
  }

  return (
    <div className={styles['qualityList']}>
      {rows.map((row) => {
        const key = row.key;
        const download = resolveQualityDownload(row, downloads, result?.download);
        const playable = Boolean(download?.url);
        const downloadState = downloadStates[key];
        const downloadStatus = downloadState?.status ?? 'idle';
        const downloadProgress = downloadState?.progress ?? 0;
        const downloading = downloadStatus === 'downloading' || downloadStatus === 'embedding';
        const parsing = parsingIds.includes(key);

        return (
          <div
            key={key}
            className={classNames(styles['qualityItem'], {
              [styles['qualityItemPlayable']]: playable,
              [styles['qualityItemLoading']]: parsing,
              [styles['qualityItemProgress']]: downloading,
              [styles['qualityItemDone']]: downloadStatus === 'done',
              [styles['qualityItemError']]: downloadStatus === 'error',
            })}
            style={
              downloading
                ? ({ '--progress': `${downloadProgress}%` } as React.CSSProperties)
                : undefined
            }>
            <span className={styles['qualityBadge']}>{qualityLabel(row.level)}</span>
            <span className={styles['qualityMeta']}>
              {formatQualityMeta(row.item, download)}
              {downloading
                ? ` · ${downloadStatus === 'embedding' ? '写入中' : `${downloadProgress.toFixed(0)}%`}`
                : null}
              {downloadStatus === 'done' ? ' · 已完成' : null}
            </span>
            <span className={styles['qualityStatus']}>
              {playable ? <span className={styles['qualityPlayableTag']}>当前可播</span> : null}
            </span>
            {playable ? (
              <div className={styles['qualityActions']}>
                <button
                  className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                  type='button'
                  aria-label={`下载${qualityLabel(row.level)}音质`}
                  disabled={downloading}
                  onClick={() => handleDownload(row, download, key)}>
                  {downloading ? (
                    <LoadingOutlined />
                  ) : downloadStatus === 'done' ? (
                    <CheckOutlined />
                  ) : (
                    <CloudDownloadOutlined />
                  )}
                  {downloading
                    ? downloadStatus === 'embedding'
                      ? '写入中'
                      : '下载中'
                    : downloadStatus === 'done'
                      ? '已完成'
                      : '下载'}
                </button>
                <button
                  className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                  type='button'
                  aria-label='复制播放地址'
                  onClick={() => handleCopyUrl(download)}>
                  复制链接
                </button>
                {/* 重新解析 */}
                <button
                  className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                  type='button'
                  aria-label='重新解析'
                  onClick={() => handleParseUrl(row, key)}>
                  重新解析
                </button>
              </div>
            ) : (
              <button
                className={classNames(
                  shared['btn'],
                  shared['btnGhost'],
                  shared['btnSm'],
                  styles['qualityCopy'],
                )}
                type='button'
                aria-label={`解析${qualityLabel(row.level)}音质地址`}
                onClick={() => handleParseUrl(row, key)}>
                {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                {parsing ? '解析中' : '解析'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SongResult;
