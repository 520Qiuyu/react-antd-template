/**
 * 格式化文件大小
 * @example
 * formatSize(4128768) // => '3.9 MB'
 */
export const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * 格式化时长（秒 → m:ss）
 * @example
 * formatDuration(326) // => '5:26'
 */
export const formatDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const QUALITY_LABEL_MAP: Record<string, string> = {
  standard: '标准',
  higher: '较高',
  lossless: '无损',
  hq: 'HQ',
};

/**
 * 音质标签文案
 * @example
 * qualityLabel('lossless') // => '无损'
 */
export const qualityLabel = (quality: string) => QUALITY_LABEL_MAP[quality] || quality;

/**
 * 延迟
 * @example
 * await sleep(700)
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
