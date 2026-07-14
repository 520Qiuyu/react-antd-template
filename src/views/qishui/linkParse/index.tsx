import {
  AppstoreOutlined,
  CustomerServiceOutlined,
  ExportOutlined,
  MenuOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import LinkParseSidebar from './components/LinkParseSidebar';
import PageAside from './components/PageAside';
import PlaylistParseView from './components/PlaylistParseView';
import SongParseView from './components/SongParseView';
import { QISHUI_HOME_URL, type LinkParseView } from './constants';
import styles from './index.module.less';
import type { TocSection } from './types';

/**
 * 链接解析
 */
const LinkParse: React.FC = () => {
  const [currentView, setCurrentView] = useState<LinkParseView>('song');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [songHasResult, setSongHasResult] = useState(false);

  const handleViewChange = useCallback((view: LinkParseView) => {
    setCurrentView(view);
    window.location.hash = view;
  }, []);

  const handleGuideClick = useCallback(() => {
    if (currentView !== 'song') {
      setCurrentView('song');
      window.location.hash = 'song';
    }
    setTimeout(() => {
      document.getElementById('guide-share')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }, [currentView]);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'playlist' || hash === 'song') {
      setCurrentView(hash);
    }
  }, []);

  const tocSections = useMemo<TocSection[]>(() => {
    if (currentView === 'song') {
      const sections: TocSection[] = [
        { id: 'song-input', label: '输入链接' },
        { id: 'song-result', label: '解析结果' },
      ];
      if (songHasResult) {
        sections.push({ id: 'song-quality', label: '音质列表' }, { id: 'song-lyric', label: '歌词' });
      }
      sections.push(
        { id: 'guide-share', label: '如何获取分享链接' },
        { id: 'guide-fields', label: '字段说明' },
      );
      return sections;
    }

    return [
      { id: 'playlist-input', label: '输入链接' },
      { id: 'playlist-result', label: '解析结果' },
    ];
  }, [currentView, songHasResult]);

  return (
    <div className={styles['page']}>
      <header className={styles['nav']} role='banner'>
        <div className={styles['navInner']}>
          <a className={styles['brand']} href='#song' aria-label='汽水音乐解析首页'>
            <span className={styles['logo']} aria-hidden='true'>
              <AppstoreOutlined />
            </span>
            <span className={styles['brandTitle']}>
              汽水解析<span>Docs</span>
            </span>
          </a>

          <nav className={styles['navLinks']} aria-label='顶部导航'>
            <button
              className={classNames(styles['navLink'], {
                [styles['isActive']]: currentView === 'song',
              })}
              type='button'
              onClick={() => handleViewChange('song')}>
              <CustomerServiceOutlined />
              歌曲解析
            </button>
            <button
              className={classNames(styles['navLink'], {
                [styles['isActive']]: currentView === 'playlist',
              })}
              type='button'
              onClick={() => handleViewChange('playlist')}>
              <UnorderedListOutlined />
              歌单解析
            </button>
            <a
              className={styles['navLink']}
              href={QISHUI_HOME_URL}
              target='_blank'
              rel='noopener noreferrer'>
              <ExportOutlined />
              汽水音乐
            </a>
          </nav>

          <button
            className={styles['navToggle']}
            type='button'
            aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
            aria-expanded={sidebarOpen}
            tabIndex={0}
            onClick={() => setSidebarOpen((prev) => !prev)}>
            <MenuOutlined />
          </button>
        </div>
      </header>

      <div
        className={classNames(styles['overlay'], { [styles['isOpen']]: sidebarOpen })}
        hidden={!sidebarOpen}
        onClick={handleCloseSidebar}
        aria-hidden={!sidebarOpen}
      />

      <div className={styles['layout']}>
        <LinkParseSidebar
          currentView={currentView}
          open={sidebarOpen}
          onViewChange={handleViewChange}
          onGuideClick={handleGuideClick}
          onClose={handleCloseSidebar}
        />

        <div className={styles['content']}>
          <div className={styles['docArea']}>
            {currentView === 'song' ? (
              <SongParseView onResultChange={setSongHasResult} />
            ) : (
              <PlaylistParseView />
            )}
          </div>
          <PageAside sections={tocSections} />
        </div>
      </div>
    </div>
  );
};

export default LinkParse;
