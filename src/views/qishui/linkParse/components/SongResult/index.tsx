import {
  CheckOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileTextOutlined,
  LinkOutlined,
  LoadingOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import copy from '@/utils/copy';
import { msgError, msgSuccess } from '@/utils/modal';
import { formatSize, qualityLabel } from '../../utils';
import { SodaAudioDecryptor } from '../../sodaDecryptor';
import styles from './index.module.less';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const sanitizeFilenamePart = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_').trim();

const buildFilename = (title: string | undefined, artist: string | undefined, item: QishuiUrl) => {
  const name = sanitizeFilenamePart(title || '未知歌曲');
  const singer = sanitizeFilenamePart(artist || '未知歌手');
  const ext = (item.format || 'm4a').replace(/^\./, '') || 'm4a';
  return `${name}-${singer}.${ext}`;
};

const buildLyricFilename = (title: string | undefined, artist: string | undefined, ext: 'lrc' | 'txt') => {
  const name = sanitizeFilenamePart(title || '未知歌曲');
  const singer = sanitizeFilenamePart(artist || '未知歌手');
  return `${name}-${singer}.${ext}`;
};

interface SongCardProps {
  data: MusicInfo;
}

/** 歌曲信息卡片 */
export const SongCard: React.FC<SongCardProps> = ({ data }) => {
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
    } catch {
      /* ignore */
    }
  };

  const handleCopyLrc = async () => {
    try {
      await copy(data.lrc || data.lrcText || '');
      setCopyLrcDone(true);
      msgSuccess('已复制歌词');
      setTimeout(() => setCopyLrcDone(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <article className={styles['songCard']}>
      <div className={styles['coverWrap']}>
        <div className={styles['coverGlow']} aria-hidden='true' />
        <img className={styles['cover']} src={data.cover} alt='专辑封面' />
      </div>
      <div className={styles['meta']}>
        <span className={styles['album']}>{data.album || '未知专辑'}</span>
        <h3 className={styles['title']}>{data.title || '未知歌曲'}</h3>
        <div className={styles['artist']}>
          {avatar ? <img className={styles['avatar']} src={avatar} alt='' /> : null}
          <span>{data.artist || '未知歌手'}</span>
        </div>
        <code className={styles['trackId']}>{data.trackId || '—'}</code>
        <div className={styles['actions']}>
          <button
            className={classNames(styles['btn'], styles['btnPrimary'], styles['btnSm'])}
            type='button'
            aria-label='复制歌曲 ID'
            onClick={handleCopyId}>
            {copyIdDone ? <CheckOutlined /> : <CopyOutlined />}
            {copyIdDone ? '已复制' : '复制 ID'}
          </button>
          <button
            className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
            type='button'
            aria-label='复制歌词'
            onClick={handleCopyLrc}>
            {copyLrcDone ? <CheckOutlined /> : <FileTextOutlined />}
            {copyLrcDone ? '已复制' : '复制歌词'}
          </button>
        </div>
      </div>
    </article>
  );
};

/** 歌曲信息摘要 */
export const SongInfoGrid: React.FC<SongCardProps> = ({ data }) => {
  return (
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
  );
};

/** 音质列表 */
export const SongQualityList: React.FC<SongCardProps> = ({ data }) => {
  const [copiedUrlIndex, setCopiedUrlIndex] = useState<number | null>(null);
  const [downloadStates, setDownloadStates] = useState<
    Record<number, { progress: number; status: 'idle' | 'downloading' | 'decrypting' | 'done' | 'error' }>
  >({});

  const patchDownloadState = (
    index: number,
    patch: Partial<{ progress: number; status: 'idle' | 'downloading' | 'decrypting' | 'done' | 'error' }>,
  ) => {
    setDownloadStates((prev) => ({
      ...prev,
      [index]: {
        progress: prev[index]?.progress ?? 0,
        status: prev[index]?.status ?? 'idle',
        ...patch,
      },
    }));
  };

  const handleCopyUrl = async (url: string, index: number) => {
    try {
      await copy(url);
      setCopiedUrlIndex(index);
      msgSuccess('已复制播放地址');
      setTimeout(() => setCopiedUrlIndex(null), 1400);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async (item: QishuiUrl, index: number) => {
    if (!item.url) {
      msgError('缺少播放地址');
      return;
    }
    if (downloadStates[index]?.status === 'downloading' || downloadStates[index]?.status === 'decrypting') {
      return;
    }

    patchDownloadState(index, { progress: 0, status: 'downloading' });

    try {
      const res = await fetch(item.url, {
        referrerPolicy: 'no-referrer',
        mode: 'cors',
      });
      if (!res.ok) {
        throw new Error(`下载失败：${res.status} ${res.statusText}`);
      }

      const contentLength = Number(res.headers.get('content-length') || 0);
      let fileBlob: Blob;

      if (!res.body) {
        fileBlob = await res.blob();
        patchDownloadState(index, { progress: 100 });
      } else {
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          const chunk = new Uint8Array(value.byteLength);
          chunk.set(value);
          chunks.push(chunk.buffer);
          receivedLength += value.length;

          if (contentLength > 0) {
            const progress = Math.min(99, Number(((receivedLength / contentLength) * 100).toFixed(2)));
            patchDownloadState(index, { progress, status: 'downloading' });
          }
        }

        const contentType = res.headers.get('content-type') || 'audio/mp4';
        fileBlob = new Blob(chunks, { type: contentType });
        patchDownloadState(index, { progress: 100, status: 'downloading' });
      }

      let resultBlob = fileBlob;
      if (item.playAuth) {
        patchDownloadState(index, { progress: 100, status: 'decrypting' });
        const { blob, decrypted, reason } = await SodaAudioDecryptor.decryptBlob(
          fileBlob,
          item.playAuth,
        );
        if (!decrypted) {
          throw new Error(reason || '解密失败');
        }
        resultBlob = blob;
      }

      downloadBlob(resultBlob, buildFilename(data.title, data.artist, item));
      patchDownloadState(index, { progress: 100, status: 'done' });
      msgSuccess(item.playAuth ? '解密下载成功' : '下载成功');
    } catch (error) {
      console.error(error);
      patchDownloadState(index, { status: 'error', progress: 0 });
      msgError(error instanceof Error ? error.message : '下载失败（可能是 CORS）');
    }
  };

  return (
    <div className={styles['qualityList']}>
      {(data.urls || []).map((item: QishuiUrl, index: number) => {
        const state = downloadStates[index];
        const progress = state?.progress ?? 0;
        const status = state?.status ?? 'idle';
        const busy = status === 'downloading' || status === 'decrypting';

        return (
          <div
            key={`${item.quality}-${index}`}
            className={classNames(styles['qualityItem'], {
              [styles['qualityItemProgress']]: status === 'downloading' || status === 'decrypting',
              [styles['qualityItemDone']]: status === 'done',
              [styles['qualityItemError']]: status === 'error',
            })}
            style={
              status === 'downloading' || status === 'decrypting'
                ? ({ '--progress': `${progress}%` } as Record<string, string>)
                : undefined
            }>
            <span className={styles['qualityBadge']}>{qualityLabel(item.quality)}</span>
            <span className={styles['qualityMeta']}>
              {(item.format || '').toUpperCase()} · {formatSize(item.size)}
              {busy ? ` · ${status === 'decrypting' ? '解密中' : `${progress}%`}` : null}
              {status === 'done' ? ' · 已完成' : null}
            </span>
            <span className={styles['qualityMeta']}>{item.encryptionMethod || 'none'}</span>
            <div className={styles['qualityActions']}>
              <button
                className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
                type='button'
                aria-label='复制播放地址'
                onClick={() => handleCopyUrl(item.url, index)}>
                {copiedUrlIndex === index ? <CheckOutlined /> : <LinkOutlined />}
                {copiedUrlIndex === index ? '已复制' : '复制链接'}
              </button>
              <button
                className={classNames(styles['btn'], styles['btnPrimary'], styles['btnSm'])}
                type='button'
                aria-label='解密下载'
                disabled={busy}
                onClick={() => handleDownload(item, index)}>
                {busy ? <LoadingOutlined /> : status === 'done' ? <CheckOutlined /> : <DownloadOutlined />}
                {busy ? (status === 'decrypting' ? '解密中' : '下载中') : status === 'done' ? '已完成' : '下载'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 歌词展示 */
export const SongLyricBox: React.FC<SongCardProps> = ({ data }) => {
  const [lyricMode, setLyricMode] = useState<'lrc' | 'txt'>('lrc');

  const lrcContent = data.lrc || '';
  const txtContent = data.lrcText || '';
  const lyricText =
    lyricMode === 'lrc'
      ? lrcContent || txtContent || '暂无歌词'
      : txtContent || lrcContent || '暂无歌词';
  const canSave = Boolean((lyricMode === 'lrc' ? lrcContent : txtContent) || lrcContent || txtContent);

  const handleSaveLyric = () => {
    const content = lyricMode === 'lrc' ? lrcContent || txtContent : txtContent || lrcContent;
    if (!content) {
      msgError('暂无歌词可保存');
      return;
    }
    downloadBlob(
      new Blob([content], { type: 'text/plain;charset=utf-8' }),
      buildLyricFilename(data.title, data.artist, lyricMode === 'lrc' ? 'lrc' : 'txt'),
    );
    msgSuccess('歌词已保存');
  };

  return (
    <div className={styles['lyricWrap']}>
      <div className={styles['lyricToolbar']}>
        <div className={styles['lyricSegment']} role='tablist' aria-label='歌词格式'>
          <button
            className={classNames(styles['lyricSegmentItem'], {
              [styles['lyricSegmentItemActive']]: lyricMode === 'lrc',
            })}
            type='button'
            role='tab'
            aria-selected={lyricMode === 'lrc'}
            onClick={() => setLyricMode('lrc')}>
            LRC
          </button>
          <button
            className={classNames(styles['lyricSegmentItem'], {
              [styles['lyricSegmentItemActive']]: lyricMode === 'txt',
            })}
            type='button'
            role='tab'
            aria-selected={lyricMode === 'txt'}
            onClick={() => setLyricMode('txt')}>
            TXT
          </button>
        </div>
        <button
          className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
          type='button'
          aria-label='保存歌词'
          disabled={!canSave}
          onClick={handleSaveLyric}>
          <SaveOutlined />
          保存
        </button>
      </div>
      <pre className={styles['lyricBox']}>{lyricText}</pre>
    </div>
  );
};

interface SongResultProps {
  data: MusicInfo;
}

/**
 * 歌曲解析结果
 */
const SongResult: React.FC<SongResultProps> = ({ data }) => {
  return (
    <div className={styles['result']} aria-live='polite'>
      <SongCard data={data} />
      <SongInfoGrid data={data} />
    </div>
  );
};

export default SongResult;
