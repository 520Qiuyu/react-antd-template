import { DEFAULT_CONFIG } from '@/hooks/useConfig';
import type { EmbedAudioMetadataOptions, EmbedOutputFormat } from '@/hooks/useEmbedAudioMetadata';
import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import { downloadBlob, getCoverBlob, getDownloadProgress } from '@/utils/download';
import { SodaAudioDecryptor } from '../../../utils/sodaDecryptor';

export type DownloadProgressPhase = 'downloading' | 'decrypting' | 'embedding';

export const DEFAULT_DOWNLOAD_NAME_FORMAT = '【歌名】-【歌手】';

export interface DownloadNameParts {
  index?: number;
  title?: string;
  album?: string;
  artist?: string;
}

export interface DownloadSongAudioOptions {
  data: MusicInfo;
  item: QishuiUrl;
  embedMetadata?: (options: EmbedAudioMetadataOptions) => Promise<Blob>;
  onProgress?: (phase: DownloadProgressPhase, progress: number) => void;
  /** 歌单列表序号（从 1 起）；单曲不传 */
  index?: number;
}

const sanitizeFilenamePart = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_').trim();

/**
 * 按配置模板解析下载文件名主体（不含扩展名）
 * @example
 * resolveDownloadBasename({ title: '晴天', artist: '周杰伦' })
 * // 默认模板 → '晴天-周杰伦'
 * resolveDownloadBasename({ index: 1, title: '晴天', artist: '周杰伦' })
 * // 若模板为【序号】-【歌名】-【歌手】 → '1-晴天-周杰伦'
 */
export const resolveDownloadBasename = (parts: DownloadNameParts): string => {
  const format =
    (typeof window !== 'undefined' && window.config?.downloadNameFormat?.trim()) ||
    DEFAULT_CONFIG.downloadNameFormat ||
    DEFAULT_DOWNLOAD_NAME_FORMAT;

  const values: Record<string, string> = {
    序号: parts.index == null ? '' : String(parts.index),
    歌名: sanitizeFilenamePart(parts.title || '未知歌曲'),
    专辑名: sanitizeFilenamePart(parts.album || '未知专辑'),
    歌手: sanitizeFilenamePart(parts.artist || '未知歌手'),
  };

  const basename = format.replace(/【(序号|歌名|专辑名|歌手)】/g, (_, key: string) => values[key] ?? '');
  const cleaned = basename.trim();
  return cleaned || '未知歌曲';
};

export const buildSongFilename = (
  data: Pick<MusicInfo, 'title' | 'artist' | 'album'>,
  item: QishuiUrl,
  forceExt?: string,
  index?: number,
) => {
  const basename = resolveDownloadBasename({
    index,
    title: data.title,
    album: data.album,
    artist: data.artist,
  });
  const ext = (forceExt || item.format || 'm4a').replace(/^\./, '') || 'm4a';
  return `${basename}.${ext}`;
};

export const buildLyricFilename = (
  data: Pick<MusicInfo, 'title' | 'artist' | 'album'>,
  ext: 'lrc' | 'txt',
  index?: number,
) => {
  const basename = resolveDownloadBasename({
    index,
    title: data.title,
    album: data.album,
    artist: data.artist,
  });
  return `${basename}.${ext}`;
};

/**
 * 下载单曲音频：拉取 → 解密 → 可选内嵌元数据 → 触发浏览器下载
 */
export const downloadSongAudio = async ({
  data,
  item,
  embedMetadata,
  onProgress,
  index,
}: DownloadSongAudioOptions) => {
  if (!item.url) {
    throw new Error('缺少播放地址');
  }

  onProgress?.('downloading', 0);
  const fileBlob = await getDownloadProgress(item.url, {
    onProgress: (progress) => {
      const ratio =
        progress.contentLength > 0 ? progress.receivedLength / progress.contentLength : 0;
      onProgress?.('downloading', ratio);
    },
  });
  if (!fileBlob) {
    throw new Error('下载失败：没有文件');
  }

  let resultBlob = fileBlob;
  if (item.playAuth) {
    onProgress?.('decrypting', 1);
    const { blob, decrypted, reason } = await SodaAudioDecryptor.decryptBlob(
      fileBlob,
      item.playAuth,
    );
    if (!decrypted) {
      throw new Error(reason || '解密失败');
    }
    resultBlob = blob;
  }

  let embedded = false;
  const outputFormat: EmbedOutputFormat =
    window.config.downloadFormat || DEFAULT_CONFIG.downloadFormat;
  if (embedMetadata) {
    try {
      onProgress?.('embedding', 0);
      const coverBlob = data.cover ? await getCoverBlob(data.cover) : null;
      resultBlob = await embedMetadata({
        audio: resultBlob,
        cover: coverBlob,
        audioName: buildSongFilename(data, item, undefined, index),
        coverName: coverBlob
          ? `cover.${data.cover?.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg'}`
          : undefined,
        outputFormat,
        metadata: {
          title: data.title,
          artist: data.artist,
          lyrics: data.lrc,
          album: data.album,
        },
        onProgress: (percent) => onProgress?.('embedding', percent / 100),
      });
      onProgress?.('embedding', 1);
      embedded = true;
    } catch (error) {
      console.log('embedMetadata skipped', error);
    }
  }

  downloadBlob(
    resultBlob,
    buildSongFilename(data, item, embedded ? outputFormat : undefined, index),
  );
};

/**
 * 下载单曲歌词（lrc 带时间轴 / txt 用后端 lrcText）
 */
export const downloadSongLyric = (data: MusicInfo, mode: 'lrc' | 'txt', index?: number) => {
  const lyricText = mode === 'lrc' ? data.lrc : data.lrcText;

  if (!lyricText?.trim()) {
    throw new Error('暂无歌词可保存');
  }

  downloadBlob(
    new Blob([lyricText], { type: 'text/plain;charset=utf-8' }),
    buildLyricFilename(data, mode, index),
  );
};

/**
 * 限制并发执行任务列表
 */
export const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) => {
  if (items.length === 0) return;
  const limit = Math.max(1, concurrency);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      await worker(items[current], current);
    }
  });

  await Promise.all(runners);
};
