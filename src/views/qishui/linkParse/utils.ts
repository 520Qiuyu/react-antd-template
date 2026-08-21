import type { MusicInfo, PlaylistMusicInfo, QishuiUrl } from '@/types/qishui';
import { msgSuccess } from '@/utils/modal';
import { DOWNLOAD_QUALITY_ORDER, type DownloadQuality } from './constants';

/**
 * 从分享文案中提取 URL
 * @example
 * ```ts
 * extractUrl('《一点》@汽水音乐 https://qishui.douyin.com/s/xxx/');
 * // => 'https://qishui.douyin.com/s/xxx/'
 * ```
 */
export const extractUrl = (text = '') => {
  const match = String(text).match(/https?:\/\/[^\s]+/i);
  return match ? match[0].replace(/[)，。；;]+$/, '') : text.trim();
};

/** 格式化文件大小 */
export const formatSize = (bytes = 0) => {
  if (bytes === 0) return '未知大小';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** 格式化时长（秒 → m:ss） */
export const formatDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** 音质标签文案 */
export const QUALITY_LABEL_MAP: Record<DownloadQuality, string> = {
  spatial: '空间音频',
  hi_res: 'Hi-Res',
  highest: '极高',
  higher: '较高',
  medium: '标准',
  standard: '标准',
  lossless: '无损',
};

export const qualityLabel = (quality: string) => QUALITY_LABEL_MAP[quality] || quality;

/** 下载音质下拉选项（顺序与 DOWNLOAD_QUALITY_ORDER 一致） */
export const DOWNLOAD_QUALITY_OPTIONS = DOWNLOAD_QUALITY_ORDER.map((value) => ({
  value,
  label: qualityLabel(value),
}));

/** 下载格式下拉选项 */
export const DOWNLOAD_FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A' },
  { value: 'flac', label: 'FLAC' },
] as const;

export type DownloadFormat = (typeof DOWNLOAD_FORMAT_OPTIONS)[number]['value'];

/** 歌单曲目是否已完成单曲解析 */
export const isTrackParsed = (track: PlaylistMusicInfo | null | undefined) =>
  Boolean(track?.fullInfo?.trackId || track?.fullInfo?.urls?.length);

/**
 * 按下载音质阶梯选取地址；缺失则降一级，最终回退到任意可用 url
 */
export const pickDownloadUrl = (
  urls: QishuiUrl[] = [],
  preferredQuality: DownloadQuality = window.config.preferredQuality,
): QishuiUrl | undefined => {
  const index = DOWNLOAD_QUALITY_ORDER.indexOf(preferredQuality);
  for (let i = index; i < DOWNLOAD_QUALITY_ORDER.length; i++) {
    const matched = urls.find((item) => item.quality === DOWNLOAD_QUALITY_ORDER[i] && item.url);
    if (matched) {
      if (i !== index) {
        msgSuccess(
          `默认选择${qualityLabel(DOWNLOAD_QUALITY_ORDER[i])}音质下载，该歌曲没有当前音质，降级为${qualityLabel(DOWNLOAD_QUALITY_ORDER[i])}音质`,
        );
      }
      return matched;
    }
  }
  msgSuccess(
    `当前没有找到${qualityLabel(preferredQuality)}音质，降级为${qualityLabel(urls[0]?.quality)}音质`,
  );
  return urls[0];
};

/** 从 fullInfo 取展示用标题 / 艺人 */
export const getMusicDisplayMeta = (
  info: MusicInfo | null | undefined,
  fallback?: PlaylistMusicInfo,
) => ({
  title: info?.title || fallback?.title || '未知歌曲',
  artist: info?.artist || fallback?.artist || '未知艺人',
});

/** 模拟解析延迟 */
export const mockParseDelay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
