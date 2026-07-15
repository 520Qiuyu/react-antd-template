import type { MusicInfo, PlaylistMusicInfo, QishuiUrl } from '@/types/qishui';
import { DOWNLOAD_QUALITY_ORDER } from './constants';

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
export const qualityLabel = (quality: string) =>
  (
    {
      spatial: '空间音频',
      hi_res: 'Hi-Res',
      highest: '极高',
      higher: '较高',
      medium: '标准',
      lossless: '无损',
      hq: 'HQ',
      standard: '标准',
    } as Record<string, string>
  )[quality] || quality;

/** 歌单曲目是否已完成单曲解析 */
export const isTrackParsed = (track: PlaylistMusicInfo | null | undefined) =>
  Boolean(track?.fullInfo?.trackId || track?.fullInfo?.urls?.length);

/**
 * 按下载音质阶梯选取地址；缺失则降一级，最终回退到任意可用 url
 */
export const pickDownloadUrl = (urls: QishuiUrl[] = []): QishuiUrl | undefined => {
  for (const quality of DOWNLOAD_QUALITY_ORDER) {
    const matched = urls.find((item) => item.quality === quality && item.url);
    if (matched) return matched;
  }
  return urls.find((item) => item.url);
};

/** 从 fullInfo 取展示用标题 / 艺人 */
export const getMusicDisplayMeta = (info: MusicInfo | null | undefined, fallback?: PlaylistMusicInfo) => ({
  title: info?.title || fallback?.title || '未知歌曲',
  artist: info?.artist || fallback?.artist || '未知艺人',
});

/** 模拟解析延迟 */
export const mockParseDelay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
