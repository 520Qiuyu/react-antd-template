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
  ({ standard: '标准', higher: '较高', lossless: '无损', hq: 'HQ' })[quality] || quality;

/** 模拟解析延迟 */
export const mockParseDelay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
