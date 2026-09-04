import { resolveDownloadBasename } from '@/hooks/useConfig';
import type { EmbedAudioMetadataOptions, EmbedOutputFormat } from '@/hooks/useEmbedAudioMetadata';
import type { ParseNeteaseSongResponseData } from '@/types/netease';
import { downloadBlob, getCoverBlob, getDownloadProgress } from '@/utils/download';
import { formatNeteaseArtistNames, toHttpsUrl } from './utils';

export type DownloadProgressPhase = 'downloading' | 'embedding';

export interface DownloadNeteaseAudioItem {
  url: string;
  format?: string;
}

export interface DownloadNeteaseSongAudioOptions {
  data: ParseNeteaseSongResponseData;
  item: DownloadNeteaseAudioItem;
  embedMetadata?: (options: EmbedAudioMetadataOptions) => Promise<Blob>;
  onProgress?: (phase: DownloadProgressPhase, progress: number) => void;
  /** 歌单列表序号（从 1 起）；单曲不传 */
  index?: number;
}

const CONTAINER_EXTS = new Set(['mp3', 'flac', 'm4a', 'aac', 'wav', 'ogg']);

/**
 * 获取扩展名，通过url最后一个.后面的内容
 * @example
 * resolveNeteaseAudioExt({ url: 'https://music.163.com/song/1234567890.mp3' }) // 'mp3'
 */
export const resolveNeteaseAudioExt = (item: { url?: string | null; format?: string }) => {
  const url = item.url?.split('?')[0];
  const ext = url?.split('.').pop()?.toLowerCase();
  if (ext && CONTAINER_EXTS.has(ext)) return ext;
  return item.format || '';
};

/**
 * 内嵌时与源文件同格式，避免转码
 * @example
 * resolveNeteaseEmbedFormat('flac') // 'flac'
 */
export const resolveNeteaseEmbedFormat = (format?: string): EmbedOutputFormat | null => {
  const ext = (format || '').trim().toLowerCase().replace(/^\./, '');
  if (ext === 'mp3') return 'mp3';
  if (ext === 'flac') return 'flac';
  if (ext === 'm4a' || ext === 'aac') return 'm4a';
  return null;
};

/**
 * 生成网易云音频下载文件名
 * @example
 * buildNeteaseSongFilename(data, item)
 */
export const buildNeteaseSongFilename = (
  data: ParseNeteaseSongResponseData,
  item: { url?: string | null; format?: string },
  forceExt?: string,
  index?: number,
) => {
  const song = data.song;
  const basename = resolveDownloadBasename({
    index,
    title: song?.name,
    album: song?.al?.name,
    artist: formatNeteaseArtistNames(song?.ar),
  });
  const ext = forceExt || resolveNeteaseAudioExt(item) || 'mp3';
  return `${basename}.${ext}`;
};

/**
 * 下载网易云单曲：拉取 → 按原格式内嵌歌词封面 → 触发浏览器下载
 * @example
 * ```ts
 * await downloadNeteaseSongAudio({ data, item, embedMetadata });
 * ```
 */
export const downloadNeteaseSongAudio = async ({
  data,
  item,
  embedMetadata,
  onProgress,
  index,
}: DownloadNeteaseSongAudioOptions) => {
  if (!item.url) {
    throw new Error('缺少播放地址');
  }

  onProgress?.('downloading', 0);
  const fileBlob = await getDownloadProgress(item.url, {
    onProgress: (progress) => {
      const ratio =
        progress.contentLength > 0 ? progress.receivedLength / progress.contentLength : 0;
      onProgress?.('downloading', ratio * 100);
    },
  });
  if (!fileBlob) {
    throw new Error('下载失败：没有文件');
  }

  let resultBlob = fileBlob;
  let embedded = false;
  const sourceExt = resolveNeteaseAudioExt(item);
  const outputFormat = resolveNeteaseEmbedFormat(sourceExt);
  const cover = toHttpsUrl(data.song?.al?.picUrl) || data.song?.al?.picUrl || '';

  if (embedMetadata && outputFormat) {
    try {
      onProgress?.('embedding', 0);
      const coverBlob = cover ? await getCoverBlob(cover) : null;
      resultBlob = await embedMetadata({
        audio: resultBlob,
        cover: coverBlob,
        audioName: buildNeteaseSongFilename(data, item, outputFormat, index),
        coverName: coverBlob
          ? `cover.${cover.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg'}`
          : undefined,
        outputFormat,
        sourceCodec: sourceExt,
        metadata: {
          title: data.song?.name,
          artist: formatNeteaseArtistNames(data.song?.ar),
          lyrics: data.lyric?.lrc,
          album: data.song?.al?.name,
        },
        onProgress: (percent) => onProgress?.('embedding', percent),
      });
      onProgress?.('embedding', 100);
      embedded = true;
    } catch (error) {
      console.log('embedMetadata skipped', error);
    }
  }

  downloadBlob(
    resultBlob,
    buildNeteaseSongFilename(data, item, embedded ? outputFormat || undefined : undefined, index),
  );
};
