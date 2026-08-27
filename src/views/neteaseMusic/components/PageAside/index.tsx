import type { TocSection } from '../../types';
import styles from './index.module.less';

interface PageAsideProps {
  sections: TocSection[];
}

/**
 * 页面右侧目录
 * @example
 * ```tsx
 * <PageAside sections={[{ id: 'parse-input', label: '输入链接' }]} />
 * ```
 */
const PageAside: React.FC<PageAsideProps> = ({ sections }) => {
  const handleLinkClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className={styles['aside']} aria-label='本页目录'>
      <p className={styles['title']}>On this page</p>
      <nav>
        {sections.map((section) => (
          <a
            key={section.id}
            className={styles['link']}
            href={`#${section.id}`}
            onClick={(event) => {
              event.preventDefault();
              handleLinkClick(section.id);
            }}>
            {section.label}
          </a>
        ))}
      </nav>
      <div className={styles['card']}>
        <h4>网易云音乐 · Docs</h4>
        <p>朱漆红 #c20c0c 铺在宣纸底上，阴影走墨色，不靠金黄撑场。</p>
      </div>
    </aside>
  );
};

export default PageAside;
