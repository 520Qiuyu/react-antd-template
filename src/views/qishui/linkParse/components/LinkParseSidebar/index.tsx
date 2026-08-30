import { DownloadConcurrencyField, DownloadNameFormatField } from '@/components';
import { useClickOutside, useSearchParams } from '@/hooks';
import { DEFAULT_CONFIG, useConfig } from '@/hooks/useConfig';
import {
  CustomerServiceOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Select } from 'antd';
import classNames from 'classnames';
import type { SearchParams } from '../..';
import type { LinkParseView } from '../../constants';
import { useParseStore } from '../../store';
import {
  DOWNLOAD_FORMAT_OPTIONS,
  DOWNLOAD_QUALITY_OPTIONS,
  type DownloadFormat,
} from '../../utils';
import styles from './index.module.less';

interface LinkParseSidebarProps {
  onGuideClick: () => void;
}

/**
 * 链接解析侧边栏
 */
const LinkParseSidebar: React.FC<LinkParseSidebarProps> = ({ onGuideClick }) => {
  const { setSearchParams, searchParams } = useSearchParams<SearchParams>();
  const sidebarOpen = useParseStore((state) => state.sidebarOpen);
  const setSidebarOpen = useParseStore((state) => state.setSidebarOpen);
  const { config, setConfig } = useConfig();
  const { preferredQuality, downloadFormat } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const handleViewClick = (view: LinkParseView) => {
    setSearchParams((prev) => ({ ...prev, currentView: view }));
    setSidebarOpen(false);
  };

  const handleGuideClick = () => {
    onGuideClick();
    setSidebarOpen(false);
  };

  const siderBarRef = useClickOutside(() => {
    setSidebarOpen(false);
  });

  return (
    <aside
      ref={siderBarRef}
      className={classNames(styles['sidebar'], { [styles['isOpen']]: sidebarOpen })}
      aria-label='文档侧边栏'>
      <div className={styles['group']}>
        <p className={styles['heading']}>解析工具</p>
        <button
          className={classNames(styles['item'], {
            [styles['isActive']]: searchParams.currentView === 'song',
          })}
          type='button'
          aria-current={searchParams.currentView === 'song' ? 'page' : undefined}
          onClick={() => handleViewClick('song')}>
          <CustomerServiceOutlined />
          歌曲解析
        </button>
        <button
          className={classNames(styles['item'], {
            [styles['isActive']]: searchParams.currentView === 'playlist',
          })}
          type='button'
          aria-current={searchParams.currentView === 'playlist' ? 'page' : undefined}
          onClick={() => handleViewClick('playlist')}>
          <UnorderedListOutlined />
          歌单解析
        </button>
      </div>

      <div className={styles['group']}>
        <p className={styles['heading']}>参考</p>
        <button className={styles['item']} type='button' onClick={handleGuideClick}>
          <QuestionCircleOutlined />
          如何获取分享链接
        </button>
        <button className={styles['item']} type='button' onClick={handleGuideClick}>
          <ProfileOutlined />
          字段说明
        </button>
      </div>

      <div className={styles['settings']}>
        <strong className={styles['settingsTitle']}>下载设置</strong>

        <label className={styles['field']} htmlFor='download-format'>
          <span className={styles['fieldLabel']}>下载格式</span>
          <Select
            id='download-format'
            className={styles['fieldSelect']}
            value={downloadFormat}
            options={[...DOWNLOAD_FORMAT_OPTIONS]}
            onChange={(value) => setConfig({ ...config!, downloadFormat: value as DownloadFormat })}
            popupMatchSelectWidth
            aria-label='下载格式'
          />
        </label>

        <label className={styles['field']} htmlFor='preferred-quality'>
          <span className={styles['fieldLabel']}>首选下载音质</span>
          <Select
            id='preferred-quality'
            className={styles['fieldSelect']}
            value={preferredQuality}
            options={DOWNLOAD_QUALITY_OPTIONS}
            onChange={(value) =>
              setConfig({
                ...config!,
                preferredQuality: value,
              })
            }
            popupMatchSelectWidth
            aria-label='首选下载音质'
          />
        </label>

        {/* 下载并发量 */}
        <DownloadConcurrencyField theme='qishui' />
        {/* 下载名称格式 */}
        <DownloadNameFormatField theme='qishui' ext={downloadFormat} />
      </div>
    </aside>
  );
};

export default memo(LinkParseSidebar);
