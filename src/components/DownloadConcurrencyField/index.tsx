import { DEFAULT_CONFIG, useConfig } from '@/hooks/useConfig';
import { isDebugging } from '@/utils';
import { confirm } from '@/utils/modal';
import classNames from 'classnames';
import styles from './index.module.less';

export type DownloadConcurrencyTheme = 'qishui' | 'netease';

export const DOWNLOAD_CONCURRENCY_OPTIONS = [1, 2, 3, 4, 5] as const;
export type DownloadConcurrencyOption = (typeof DOWNLOAD_CONCURRENCY_OPTIONS)[number];

interface DownloadConcurrencyFieldProps {
  /** 配色主题：汽水绿 / 网易红 */
  theme?: DownloadConcurrencyTheme;
}

/**
 * 下载并发量设置
 * @example
 * ```tsx
 * <DownloadConcurrencyField theme='netease' />
 * ```
 */
const DownloadConcurrencyField: React.FC<DownloadConcurrencyFieldProps> = ({
  theme = 'qishui',
}) => {
  const { config, setConfig } = useConfig();
  const downloadConcurrency = config?.downloadConcurrency ?? DEFAULT_CONFIG.downloadConcurrency;

  const handleChange = async (value: DownloadConcurrencyOption) => {
    try {
      if (value >= 3) {
        await confirm(
          '下载并发量大于3时，可能会导致电脑负载过高，是否继续？对电脑性能、内存有自信的可以尝试！',
          '温馨提示',
          {
            wrapClassName: 'confirmWrap',
            okButtonProps: {
              type: 'primary',
              className: 'confirmOk',
            },
            cancelButtonProps: {
              type: 'default',
              className: 'confirmCancel',
            },
          },
        );
      }
      setConfig({ ...config!, downloadConcurrency: value });
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <div
      className={styles['field']}
      data-theme={theme}
      role='radiogroup'
      aria-label='下载并发量'>
      <span className={styles['fieldLabel']} id='download-concurrency-label'>
        下载并发量
      </span>
      <div className={styles['radioRow']}>
        {(isDebugging() ? DOWNLOAD_CONCURRENCY_OPTIONS : ([1, 2, 3] as const)).map((value) => {
          const checked = downloadConcurrency === value;
          return (
            <button
              key={value}
              type='button'
              role='radio'
              aria-checked={checked}
              aria-labelledby='download-concurrency-label'
              className={classNames(styles['radio'], { [styles['isActive']]: checked })}
              tabIndex={checked ? 0 : -1}
              onClick={() => handleChange(value)}>
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DownloadConcurrencyField;
