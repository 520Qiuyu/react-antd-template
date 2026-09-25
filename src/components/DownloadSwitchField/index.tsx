import { DEFAULT_CONFIG, useConfig } from '@/hooks/useConfig';
import classNames from 'classnames';
import styles from './index.module.less';

export type DownloadSwitchTheme = 'qishui' | 'netease';
export type DownloadSwitchConfigKey = 'embedMetadata' | 'embedCover' | 'downloadLyrics';

interface DownloadSwitchFieldProps {
  /** 配色主题：汽水绿 / 网易红 */
  theme?: DownloadSwitchTheme;
  /** 写入 useConfig 的字段 */
  configKey: DownloadSwitchConfigKey;
  /** 开关标题 */
  label: string;
  /** 开关说明 */
  description: string;
}

/**
 * 下载布尔开关，读写 useConfig
 * @example
 * ```tsx
 * <DownloadSwitchField
 *   theme='qishui'
 *   configKey='embedMetadata'
 *   label='写入元数据'
 *   description='封面、歌名、歌手与歌词写入音频'
 * />
 * ```
 */
const DownloadSwitchField: React.FC<DownloadSwitchFieldProps> = ({
  theme = 'qishui',
  configKey,
  label,
  description,
}) => {
  const { config, setConfig } = useConfig();
  const checked = config?.[configKey] ?? DEFAULT_CONFIG[configKey];

  const handleToggle = () => {
    setConfig({ ...config!, [configKey]: !checked });
  };

  return (
    <div className={styles['field']} data-theme={theme}>
      <div className={styles['copy']}>
        <span className={styles['fieldLabel']} id={`${configKey}-label`}>
          {label}
        </span>
        <span className={styles['description']}>{description}</span>
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        aria-labelledby={`${configKey}-label`}
        className={classNames(styles['switch'], { [styles['isOn']]: checked })}
        tabIndex={0}
        onClick={handleToggle}>
        <span className={styles['thumb']} />
      </button>
    </div>
  );
};

export default DownloadSwitchField;
