import type { EmbedAudioMetadataOptions, EmbedOutputFormat } from '@/hooks/useEmbedAudioMetadata';
import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import { downloadBlob, getCoverBlob, getDownloadProgress } from '@/utils/download';
import { SodaAudioDecryptor } from './sodaDecryptor';

export type DownloadProgressPhase = 'downloading' | 'decrypting' | 'embedding';

export interface DownloadSongAudioOptions {
  data: MusicInfo;
  item: QishuiUrl;
  embedMetadata?: (options: EmbedAudioMetadataOptions) => Promise<Blob>;
  onProgress?: (phase: DownloadProgressPhase, progress: number) => void;
}

const sanitizeFilenamePart = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_').trim();

export const buildSongFilename = (
  title: string | undefined,
  artist: string | undefined,
  item: QishuiUrl,
  forceExt?: string,
) => {
  const name = sanitizeFilenamePart(title || '未知歌曲');
  const singer = sanitizeFilenamePart(artist || '未知歌手');
  const ext = (forceExt || item.format || 'm4a').replace(/^\./, '') || 'm4a';
  return `${name}-${singer}.${ext}`;
};

export const buildLyricFilename = (
  title: string | undefined,
  artist: string | undefined,
  ext: 'lrc' | 'txt',
) => {
  const name = sanitizeFilenamePart(title || '未知歌曲');
  const singer = sanitizeFilenamePart(artist || '未知歌手');
  return `${name}-${singer}.${ext}`;
};

/**
 * 下载单曲音频：拉取 → 解密 → 可选内嵌元数据 → 触发浏览器下载
 */
export const downloadSongAudio = async ({
  data,
  item,
  embedMetadata,
  onProgress,
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
  const outputFormat: EmbedOutputFormat = 'm4a';
  if (embedMetadata) {
    try {
      onProgress?.('embedding', 1);
      const coverBlob = data.cover ? await getCoverBlob(data.cover) : null;
      resultBlob = await embedMetadata({
        audio: resultBlob,
        cover: coverBlob,
        audioName: buildSongFilename(data.title, data.artist, item),
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
      });
      embedded = true;
    } catch (error) {
      console.log('embedMetadata skipped', error);
    }
  }

  downloadBlob(
    resultBlob,
    buildSongFilename(data.title, data.artist, item, embedded ? outputFormat : undefined),
  );
};

/**
 * 下载单曲歌词（lrc 带时间轴 / txt 用后端 lrcText）
 */
export const downloadSongLyric = (data: MusicInfo, mode: 'lrc' | 'txt') => {
  const lyricText = mode === 'lrc' ? data.lrc : data.lrcText;

  if (!lyricText?.trim()) {
    throw new Error('暂无歌词可保存');
  }

  downloadBlob(
    new Blob([lyricText], { type: 'text/plain;charset=utf-8' }),
    buildLyricFilename(data.title, data.artist, mode),
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
