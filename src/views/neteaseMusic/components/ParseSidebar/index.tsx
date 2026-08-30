import { DownloadConcurrencyField, DownloadNameFormatField } from '@/components';
import { useClickOutside } from '@/hooks';
import { DEFAULT_CONFIG, useConfig } from '@/hooks/useConfig';
import type { NeteaseSoundQualityLevel } from '@/types/netease';
import { ProfileOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import classNames from 'classnames';
import { NETEASE_DOWNLOAD_QUALITY_OPTIONS, QUALITY_LABEL_MAP } from '../../constants/index';
import styles from './index.module.less';

interface ParseSidebarProps {
  open: boolean;
  onClose: () => void;
  onGuideClick: (id: string) => void;
}

/**
 * 网易云解析左侧参考栏
 * @example
 * ```tsx
 * <ParseSidebar open={open} onClose={handleClose} onGuideClick={handleGuideClick} />
 * ```
 */
const ParseSidebar: React.FC<ParseSidebarProps> = ({ open, onClose, onGuideClick }) => {
  const siderBarRef = useClickOutside<HTMLElement>(() => {
    if (open) onClose();
  });
  const { config, setConfig } = useConfig();
  const { neteasePreferredQuality } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const handleGuideShare = () => {
    onGuideClick('guide-share');
  };

  const handleGuideFields = () => {
    onGuideClick('guide-fields');
  };

  const ext = QUALITY_LABEL_MAP[neteasePreferredQuality]?.format;
  return (
    <aside
      ref={siderBarRef}
      className={classNames(styles['sidebar'], { [styles['isOpen']]: open })}
      aria-label='文档侧边栏'>
      <div className={styles['group']}>
        <p className={styles['heading']}>参考</p>
        <button className={styles['item']} type='button' onClick={handleGuideShare}>
          <QuestionCircleOutlined />
          如何获取分享链接
        </button>
        <button className={styles['item']} type='button' onClick={handleGuideFields}>
          <ProfileOutlined />
          字段说明
        </button>
      </div>

      <div className={styles['settings']}>
        <strong className={styles['settingsTitle']}>下载设置</strong>

        <label className={styles['field']} htmlFor='netease-preferred-quality'>
          <span className={styles['fieldLabel']}>首选下载音质</span>
          <Select
            id='netease-preferred-quality'
            className={styles['fieldSelect']}
            value={neteasePreferredQuality}
            options={NETEASE_DOWNLOAD_QUALITY_OPTIONS}
            onChange={(value) =>
              setConfig({
                ...config!,
                neteasePreferredQuality: value as NeteaseSoundQualityLevel,
              })
            }
            popupMatchSelectWidth
            aria-label='首选下载音质'
          />
        </label>

        {/* 下载并发量 */}
        <DownloadConcurrencyField theme='netease' />
        {/* 下载名称格式 */}
        <DownloadNameFormatField theme='netease' ext={ext} />
      </div>
    </aside>
  );
};

export default ParseSidebar;
