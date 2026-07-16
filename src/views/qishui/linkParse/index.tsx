import { useSearchParams } from '@/hooks';
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
import { useParseStore } from './store';

const defaultSearchParams: SearchParams = {
  currentView: 'song',
  sidebarOpen: false,
};
const LinkParse: React.FC = () => {
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);
  const tocSections = useParseStore((state) => state.tocSections);

  const handleGuideClick = useCallback(() => {
    if (searchParams.currentView !== 'song') {
      setSearchParams({ ...searchParams, currentView: 'song' });
    }
    setTimeout(() => {
      document
        .getElementById('guide-share')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }, [searchParams.currentView]);

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
                [styles['isActive']]: searchParams.currentView === 'song',
              })}
              type='button'
              onClick={() => setSearchParams({ ...searchParams, currentView: 'song' })}>
              <CustomerServiceOutlined />
              歌曲解析
            </button>
            <button
              className={classNames(styles['navLink'], {
                [styles['isActive']]: searchParams.currentView === 'playlist',
              })}
              type='button'
              onClick={() => setSearchParams({ ...searchParams, currentView: 'playlist' })}>
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
            aria-label={searchParams.sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
            aria-expanded={searchParams.sidebarOpen}
            tabIndex={0}
            onClick={() =>
              setSearchParams({ ...searchParams, sidebarOpen: !searchParams.sidebarOpen })
            }>
            <MenuOutlined />
          </button>
        </div>
      </header>

      <div
        className={classNames(styles['overlay'], { [styles['isOpen']]: searchParams.sidebarOpen })}
        hidden={!searchParams.sidebarOpen}
        onClick={() => setSearchParams({ ...searchParams, sidebarOpen: false })}
        aria-hidden={!searchParams.sidebarOpen}
      />

      <div className={styles['layout']}>
        <LinkParseSidebar onGuideClick={handleGuideClick} />

        <div className={styles['content']}>
          <div className={styles['docArea']}>
            {searchParams.currentView === 'song' ? <SongParseView /> : <PlaylistParseView />}
          </div>
          <PageAside sections={tocSections} />
        </div>
      </div>
    </div>
  );
};

export default LinkParse;

export interface SearchParams {
  currentView: LinkParseView;
  sidebarOpen: boolean;
}
