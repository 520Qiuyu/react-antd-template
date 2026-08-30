import { reqGetNeteaseSongDownload } from '@/apis';
import { useEmbedAudioMetadata, useSearchParams } from '@/hooks';
import type { NeteaseSoundQualityLevel } from '@/types/netease';
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
import type { NeteaseSongInfo, NeteaseUrl } from '../../../types';
import {
  applyNeteaseDownloadToUrl,
  formatBitrate,
  formatSampleRate,
  formatSize,
  qualityLabel,
} from '../../../utils';
import styles from './index.module.less';
import type { SearchParams } from '../..';

interface SongResultProps {
  data: NeteaseSongInfo;
}

/**
 * 单曲解析结果卡片
 * @example
 * ```tsx
 * <SongResult data={MOCK_SONG} />
 * ```
 */
const SongResult: React.FC<SongResultProps> = ({ data }) => {
  const [copyIdDone, setCopyIdDone] = useState(false);
  const [copyLrcDone, setCopyLrcDone] = useState(false);
  const avatar = data.artists?.[0]?.avatar;

  const handleCopyId = async () => {
    if (!data.trackId) return;
    try {
      await copy(data.trackId);
      setCopyIdDone(true);
      msgSuccess('已复制歌曲 ID');
      setTimeout(() => setCopyIdDone(false), 1400);
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  const handleCopyLrc = async () => {
    const text = data.lrc || data.lrcText || '';
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
          <img className={styles['cover']} src={data.cover} alt='专辑封面' />
        </div>
        <div className={styles['meta']}>
          <span className={styles['album']}>{data.album || '未知专辑'}</span>
          <h3 className={styles['title']} title={data.title || '未知歌曲'}>
            {data.title || '未知歌曲'}
          </h3>
          <div className={styles['artist']}>
            {avatar ? <img className={styles['avatar']} src={avatar} alt='' /> : null}
            <span>{data.artist || '未知歌手'}</span>
          </div>
          <code className={styles['trackId']}>{data.trackId || '—'}</code>
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
          ['艺人', data.artist || '—'],
          ['专辑', data.album || '—'],
          ['音质数', `${data.urls?.length || 0} 档`],
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

/**
 * 拼接音质元信息
 * @example
 * formatQualityMeta(item) // => '320 kbps · 44.1 kHz · MP3 · 5.2 MB'
 */
const formatQualityMeta = (item: NeteaseUrl) => {
  const parts = [
    formatBitrate(item.br),
    formatSampleRate(item.sr),
    item.format ? item.format.toUpperCase() : '',
    item.size ? formatSize(item.size) : '',
  ].filter(Boolean);
  return parts.join(' · ') || '—';
};

/**
 * 拼接音质 ID
 * @example
 * formatQualityId(item) // => '320-mp3-0'
 */
const formatQualityId = (item: NeteaseUrl) => {
  return `${item.quality}-${item.format}`;
};

/**
 * 音质列表
 * @example
 * ```tsx
 * <SongQualityList trackId={data.trackId} urls={data.urls} />
 * ```
 */
export const SongQualityList: React.FC = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  const { result, setResult } = useSongParseStore();
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

  const handleDownload = async (item: NeteaseUrl, key: string) => {
    if (!result) return;
    if (!item.url) {
      msgError('缺少播放地址');
      return;
    }
    const current = downloadStates[key]?.status;
    if (current === 'downloading' || current === 'embedding') return;

    patchDownloadState(key, { progress: 0, status: 'downloading' });
    try {
      await downloadNeteaseSongAudio({
        data: result,
        item,
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

  const handleCopyUrl = async (item: NeteaseUrl) => {
    if (!item.url) return;
    try {
      await copy(item.url);
      msgSuccess('已复制播放地址');
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  const handleParseUrl = async (item: NeteaseUrl, key: string) => {
    const { trackId } = result || {};
    if (!trackId) return;
    if (!item.quality) {
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
        id: trackId,
        level: item.quality as NeteaseSoundQualityLevel,
        cardSecret: searchParams.cardSecret,
      });
      const download = res.data;
      if (res.code !== 200 || !download?.url) {
        msgError(res.message || '解析地址失败');
        return;
      }
      const latestResult = useSongParseStore.getState().result;
      if (!latestResult) return;
      setResult({
        ...latestResult,
        urls: latestResult.urls?.map((row) => {
          const id = formatQualityId(row);
          return id === key ? applyNeteaseDownloadToUrl(row, download) : row;
        }),
      });
      msgSuccess('解析成功');
    } catch (error) {
      console.log('error', error);
      msgError('解析地址失败');
    } finally {
      setParsingIds((prev) => prev.filter((id) => id !== key));
    }
  };

  const urls = useMemo(() => [...(result?.urls || [])]?.reverse(), [result]);

  if (!urls.length) {
    return <p className={styles['qualityEmpty']}>暂无音质信息</p>;
  }

  return (
    <div className={styles['qualityList']}>
      {urls.map((item) => {
        const key = formatQualityId(item);
        const downloadState = downloadStates[key];
        const downloadStatus = downloadState?.status ?? 'idle';
        const downloadProgress = downloadState?.progress ?? 0;
        const downloading = downloadStatus === 'downloading' || downloadStatus === 'embedding';
        const parsing = parsingIds.includes(key);

        return (
          <div
            key={key}
            className={classNames(styles['qualityItem'], {
              [styles['qualityItemPlayable']]: item.playable,
              [styles['qualityItemLoading']]: parsingIds.includes(key),
              [styles['qualityItemProgress']]: downloading,
              [styles['qualityItemDone']]: downloadStatus === 'done',
              [styles['qualityItemError']]: downloadStatus === 'error',
            })}
            style={
              downloading
                ? ({ '--progress': `${downloadProgress}%` } as React.CSSProperties)
                : undefined
            }>
            <span className={styles['qualityBadge']}>{qualityLabel(item.quality)}</span>
            <span className={styles['qualityMeta']}>
              {formatQualityMeta(item)}
              {downloading
                ? ` · ${downloadStatus === 'embedding' ? '写入中' : `${downloadProgress.toFixed(0)}%`}`
                : null}
              {downloadStatus === 'done' ? ' · 已完成' : null}
            </span>
            <span className={styles['qualityStatus']}>
              {item.playable ? (
                <span className={styles['qualityPlayableTag']}>当前可播</span>
              ) : null}
            </span>
            {item.url ? (
              <div className={styles['qualityActions']}>
                <button
                  className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                  type='button'
                  aria-label={`下载${qualityLabel(item.quality)}音质`}
                  disabled={downloading}
                  onClick={() => handleDownload(item, key)}>
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
                  onClick={() => handleCopyUrl(item)}>
                  复制链接
                </button>
                {/* 重新解析 */}
                <button
                  className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
                  type='button'
                  aria-label='重新解析'
                  onClick={() => handleParseUrl(item, key)}>
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
                aria-label={`解析${qualityLabel(item.quality)}音质地址`}
                onClick={() => handleParseUrl(item, key)}>
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
