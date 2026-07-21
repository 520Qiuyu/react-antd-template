import { type TocSection } from '../../store';
import CardSecretPanel from '../CardSecretPanel';
import styles from './index.module.less';

interface PageAsideProps {
  sections: TocSection[];
}

/**
 * 页面右侧目录 + 卡密信息
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

      <CardSecretPanel />
    </aside>
  );
};

export default PageAside;
