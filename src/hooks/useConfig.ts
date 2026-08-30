import type { NeteaseSoundQualityLevel } from '@/types/netease';
import { DOWNLOAD_QUALITY_ORDER, type DownloadQuality } from '@/views/qishui/linkParse/constants';
import type { DownloadFormat } from '@/views/qishui/linkParse/utils';

const CONFIG_KEY = 'config';

export const useConfig = () => {
  const [config, setConfig] = useLocalStorageState(CONFIG_KEY, {
    defaultValue: DEFAULT_CONFIG,
    listenStorageChange: true,
  });

  useEffect(() => {
    // 合并默认值，兼容旧 localStorage 缺字段
    window.config = { ...DEFAULT_CONFIG, ...(config || {}) };
  }, [config]);

  return {
    config,
    setConfig,
  };
};

interface Config {
  downloadFormat: DownloadFormat;
  /** 汽水首选下载音质 */
  preferredQuality: DownloadQuality;
  /** 网易云首选下载音质 */
  neteasePreferredQuality: NeteaseSoundQualityLevel;
  downloadNameFormat: string;
  /** 歌单批量解析 / 下载并发数 */
  downloadConcurrency: 1 | 2 | 3 | 4 | 5;
}
declare global {
  interface Window {
    config: Config;
  }
}
export const DEFAULT_CONFIG: Config = {
  downloadFormat: 'mp3',
  preferredQuality: DOWNLOAD_QUALITY_ORDER[0],
  neteasePreferredQuality: 'exhigh',
  downloadNameFormat: '【歌名】-【歌手】',
  downloadConcurrency: 2,
};

export interface DownloadNameParts {
  index?: number;
  title?: string;
  album?: string;
  artist?: string;
}

/**
 * 按配置模板解析下载文件名主体（不含扩展名）
 * @example
 * resolveDownloadBasename({ title: '晴天', artist: '周杰伦' })
 * // 默认模板 → '晴天-周杰伦'
 * resolveDownloadBasename({ index: 1, title: '晴天', artist: '周杰伦' }, '【序号】-【歌名】-【歌手】')
 * // → '1-晴天-周杰伦'
 */
export const resolveDownloadBasename = (parts: DownloadNameParts, nameFormat?: string): string => {
  const format =
    nameFormat?.trim() ||
    (typeof window !== 'undefined' && window.config?.downloadNameFormat?.trim()) ||
    DEFAULT_CONFIG.downloadNameFormat;

  const sanitizeFilenamePart = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_').trim();

  const values: Record<string, string> = {
    序号: parts.index == null ? '' : String(parts.index),
    歌名: sanitizeFilenamePart(parts.title || '未知歌曲'),
    专辑名: sanitizeFilenamePart(parts.album || '未知专辑'),
    歌手: sanitizeFilenamePart(parts.artist || '未知歌手'),
  };

  const basename = format.replace(
    /【(序号|歌名|专辑名|歌手)】/g,
    (_, key: string) => values[key] ?? '',
  );
  const cleaned = basename.trim();
  return cleaned || '未知歌曲';
};
