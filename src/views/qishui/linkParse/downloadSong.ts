import { DEFAULT_CONFIG, resolveDownloadBasename } from '@/hooks/useConfig';
import type { EmbedAudioMetadataOptions, EmbedOutputFormat } from '@/hooks/useEmbedAudioMetadata';
import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import { downloadBlob, getCoverBlob, getDownloadProgress } from '@/utils/download';
import { SodaAudioDecryptor } from '../../../utils/sodaDecryptor';

export type DownloadProgressPhase = 'downloading' | 'decrypting' | 'embedding';

export interface DownloadSongAudioOptions {
  data: MusicInfo;
  item: QishuiUrl;
  embedMetadata?: (options: EmbedAudioMetadataOptions) => Promise<Blob>;
  /** 下载进度回调 ratio: 0-1*/
  onProgress?: (phase: DownloadProgressPhase, ratio: number) => void;
  /** 歌单列表序号（从 1 起）；单曲不传 */
  index?: number;
}

const START_RATIO = 0;
const END_RATIO = 1;

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

  onProgress?.('downloading', START_RATIO);
  const fileBlob = await getDownloadProgress(item.url, {
    onProgress: (progress) => {
      const ratio =
        progress.contentLength > 0 ? progress.receivedLength / progress.contentLength : 0;
      onProgress?.('downloading', Number(ratio.toFixed(2)));
    },
  });
  if (!fileBlob) {
    throw new Error('下载失败：没有文件');
  }

  let resultBlob = fileBlob;
  if (item.playAuth) {
    const { blob, decrypted, reason } = await SodaAudioDecryptor.decryptBlob(
      fileBlob,
      item.playAuth,
    );
    if (!decrypted) {
      throw new Error(reason || '解密失败');
    }
    resultBlob = blob;
    onProgress?.('decrypting', END_RATIO);
  }

  let embedded = false;
  const outputFormat: EmbedOutputFormat =
    window.config.downloadFormat || DEFAULT_CONFIG.downloadFormat;
  if (embedMetadata) {
    try {
      onProgress?.('embedding', START_RATIO);
      const coverBlob = data.cover ? await getCoverBlob(data.cover) : null;
      resultBlob = await embedMetadata({
        audio: resultBlob,
        cover: coverBlob,
        audioName: buildSongFilename(data, item, undefined, index),
        coverName: coverBlob
          ? `cover.${data.cover?.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg'}`
          : undefined,
        outputFormat,
        sourceCodec: item.codec,
        metadata: {
          title: data.title,
          artist: data.artist,
          lyrics: data.lrc,
          album: data.album,
        },
        onProgress: (percent) => onProgress?.('embedding', percent / 100),
      });
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
