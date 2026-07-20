import { DOWNLOAD_QUALITY_ORDER } from '@/views/qishui/linkParse/constants';
import type { DownloadFormat } from '@/views/qishui/linkParse/utils';

const CONFIG_KEY = 'config';

export const useConfig = () => {
  const [config, setConfig] = useLocalStorageState(CONFIG_KEY, {
    defaultValue: DEFAULT_CONFIG,
    listenStorageChange: true,
  });

  useEffect(() => {
    window.config = config || DEFAULT_CONFIG;
  }, [config]);

  return {
    config,
    setConfig,
  };
};

interface Config {
  downloadFormat: DownloadFormat;
  preferredQuality: (typeof DOWNLOAD_QUALITY_ORDER)[number];
}
declare global {
  interface Window {
    config: Config;
  }
}
export const DEFAULT_CONFIG: Config = {
  downloadFormat: 'm4a',
  preferredQuality: DOWNLOAD_QUALITY_ORDER[0],
};
