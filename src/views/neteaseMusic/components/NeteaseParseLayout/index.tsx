import { CustomerServiceOutlined, ExportOutlined, MenuOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { NETEASE_HOME_URL } from '../../constants';
import { useNeteaseParseContext } from '../NeteaseParseContext';
import PageAside from '../PageAside';
import ParseSidebar from '../ParseSidebar';
import styles from './index.module.less';

interface NeteaseParseLayoutProps {
  children: React.ReactNode;
}

/**
 * 网易云解析三栏文档布局
 * @example
 * ```tsx
 * <NeteaseParseLayout>
 *   <SongPage />
 * </NeteaseParseLayout>
 * ```
 */
const NeteaseParseLayout: React.FC<NeteaseParseLayoutProps> = ({ children }) => {
  const { tocSections, setMode } = useNeteaseParseContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleBrandClick = () => {
    setMode('song');
  };

  const handleGuideClick = (id: string) => {
    setSidebarOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className={styles['page']}>
      <header className={styles['nav']} role='banner'>
        <div className={styles['navInner']}>
          <button
            className={styles['brand']}
            type='button'
            aria-label='网易云音乐解析首页'
            onClick={handleBrandClick}>
            <span className={styles['logo']} aria-hidden='true'>
              <CustomerServiceOutlined />
            </span>
            <span className={styles['brandTitle']}>
              网易云解析<span>Docs</span>
            </span>
          </button>

          <nav className={styles['navLinks']} aria-label='顶部导航'>
            <a
              className={styles['navLink']}
              href={NETEASE_HOME_URL}
              target='_blank'
              rel='noopener noreferrer'>
              <ExportOutlined />
              网易云音乐
            </a>
          </nav>

          <button
            className={styles['navToggle']}
            type='button'
            aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
            aria-expanded={sidebarOpen}
            tabIndex={0}
            onClick={handleToggleSidebar}>
            <MenuOutlined />
          </button>
        </div>
      </header>

      <div
        className={classNames(styles['overlay'], { [styles['isOpen']]: sidebarOpen })}
        onClick={handleCloseSidebar}
      />

      <div className={styles['layout']}>
        <ParseSidebar
          open={sidebarOpen}
          onClose={handleCloseSidebar}
          onGuideClick={handleGuideClick}
        />
        <div className={styles['content']}>
          <div className={styles['docArea']}>{children}</div>
          <PageAside sections={tocSections} />
        </div>
      </div>
    </div>
  );
};

export default NeteaseParseLayout;
