import type { TocSection } from '../../store';
import styles from './index.module.less';

interface PageAsideProps {
  sections: TocSection[];
}

/**
 * 页面右侧目录
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
            }}
          >
            {section.label}
          </a>
        ))}
      </nav>
      <div className={styles['card']}>
        <h4>汽水音乐 · Docs</h4>
        <p>清爽绿 + 气泡青 + 柠檬黄，搭配毛玻璃材质，贴合汽水音乐品牌气质。</p>
      </div>
    </aside>
  );
};

export default PageAside;
