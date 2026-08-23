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
  preferredQuality: DownloadQuality;
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
  downloadNameFormat: '【歌名】-【歌手】',
  downloadConcurrency: 2,
};
