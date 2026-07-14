import {
  CustomerServiceOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import type { LinkParseView } from '../../constants';
import styles from './index.module.less';

interface LinkParseSidebarProps {
  currentView: LinkParseView;
  onViewChange: (view: LinkParseView) => void;
  onGuideClick: () => void;
  open: boolean;
  onClose: () => void;
}

/**
 * 链接解析侧边栏
 */
const LinkParseSidebar: React.FC<LinkParseSidebarProps> = ({
  currentView,
  onViewChange,
  onGuideClick,
  open,
  onClose,
}) => {
  const handleViewClick = (view: LinkParseView) => {
    onViewChange(view);
    onClose();
  };

  const handleGuideClick = () => {
    onGuideClick();
    onClose();
  };

  return (
    <aside
      className={classNames(styles['sidebar'], { [styles['isOpen']]: open })}
      aria-label='文档侧边栏'>
      <div className={styles['group']}>
        <p className={styles['heading']}>解析工具</p>
        <button
          className={classNames(styles['item'], {
            [styles['isActive']]: currentView === 'song',
          })}
          type='button'
          aria-current={currentView === 'song' ? 'page' : undefined}
          onClick={() => handleViewClick('song')}>
          <CustomerServiceOutlined />
          歌曲解析
        </button>
        <button
          className={classNames(styles['item'], {
            [styles['isActive']]: currentView === 'playlist',
          })}
          type='button'
          aria-current={currentView === 'playlist' ? 'page' : undefined}
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

      <div className={styles['meta']}>
        <strong>原型说明</strong>
        <p>本页为静态交互原型。点击「解析」会演示结果展示；接入后端后可改为真实接口。</p>
      </div>
    </aside>
  );
};

export default LinkParseSidebar;
