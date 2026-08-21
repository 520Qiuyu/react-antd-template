import { useClickOutside, useSearchParams } from '@/hooks';
import { DEFAULT_CONFIG, useConfig } from '@/hooks/useConfig';
import {
  CustomerServiceOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Input, Select } from 'antd';
import classNames from 'classnames';
import { useRef } from 'react';
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

const NAME_FORMAT_TOKENS = ['【序号】', '【歌名】', '【专辑名】', '【歌手】'] as const;

/**
 * 链接解析侧边栏
 */
const LinkParseSidebar: React.FC<LinkParseSidebarProps> = ({ onGuideClick }) => {
  const { setSearchParams, searchParams } = useSearchParams<SearchParams>();
  const sidebarOpen = useParseStore((state) => state.sidebarOpen);
  const setSidebarOpen = useParseStore((state) => state.setSidebarOpen);
  const { config, setConfig } = useConfig();
  const { preferredQuality, downloadFormat, downloadNameFormat, downloadConcurrency } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  const inputRef = useRef<InputRef>(null);

  const handleViewClick = (view: LinkParseView) => {
    setSearchParams((prev) => ({ ...prev, currentView: view }));
    setSidebarOpen(false);
  };

  const handleGuideClick = () => {
    onGuideClick();
    setSidebarOpen(false);
  };

  const handleNameFormatChange = (value: string) => {
    setConfig({ ...config!, downloadNameFormat: value });
  };

  console.log('render');

  /**
   * 在输入框光标处插入占位符；无输入元素时追加到末尾
   * @example
   * handleInsertToken('【专辑名】')
   */
  const handleInsertToken = (token: string) => {
    const current = downloadNameFormat ?? DEFAULT_CONFIG.downloadNameFormat;
    const el = inputRef.current?.input;
    if (!el) {
      handleNameFormatChange(`${current}${token}`);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
    handleNameFormatChange(next);
    requestAnimationFrame(() => {
      const pos = start + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
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
        <div className={styles['field']} role='radiogroup' aria-label='下载并发量'>
          <span className={styles['fieldLabel']} id='download-concurrency-label'>
            下载并发量
          </span>
          <div className={styles['radioRow']}>
            {([1, 2, 3] as const).map((value) => {
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
                  onClick={() => setConfig({ ...config!, downloadConcurrency: value })}>
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        {/* 下载名称格式 */}
        <label className={styles['field']} htmlFor='download-name-format'>
          <span className={styles['fieldLabel']}>下载名称格式</span>
          <Input
            id='download-name-format'
            ref={inputRef}
            className={styles['fieldInput']}
            value={downloadNameFormat}
            onChange={(e) => handleNameFormatChange(e.target.value)}
            placeholder={DEFAULT_CONFIG.downloadNameFormat}
            aria-label='下载名称格式'
          />
          <div className={styles['tokenRow']} role='group' aria-label='插入占位符'>
            {NAME_FORMAT_TOKENS.map((token) => (
              <button
                key={token}
                type='button'
                className={styles['token']}
                onClick={() => handleInsertToken(token)}>
                {token}
              </button>
            ))}
          </div>
        </label>
      </div>
    </aside>
  );
};

export default memo(LinkParseSidebar);
