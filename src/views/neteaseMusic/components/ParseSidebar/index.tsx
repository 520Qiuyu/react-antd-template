import { useClickOutside } from '@/hooks';
import { ProfileOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
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

  const handleGuideShare = () => {
    onGuideClick('guide-share');
  };

  const handleGuideFields = () => {
    onGuideClick('guide-fields');
  };

  return (
    <aside
      ref={siderBarRef}
      className={classNames(styles['sidebar'], { [styles['isOpen']]: open })}
      aria-label='文档侧边栏'>
      <div>
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

      <div className={styles['meta']}>
        <strong>原型说明</strong>
        <p>本页为静态交互原型。点击「解析」会演示结果展示；接入后端后可改为真实接口。</p>
      </div>
    </aside>
  );
};

export default ParseSidebar;
