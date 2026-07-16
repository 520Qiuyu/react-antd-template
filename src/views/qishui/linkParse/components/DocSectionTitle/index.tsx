import classNames from 'classnames';
import styles from './index.module.less';

interface DocSectionTitleProps {
  id: string;
  children: React.ReactNode;
  title: React.ReactNode;
  first?: boolean;
}

/**
 * 文档区块标题
 */
const DocSectionTitle: React.FC<DocSectionTitleProps> = ({ id, children, first, title }) => {
  return (
    <h2 id={id} className={classNames(styles['sectionTitle'], { [styles['first']]: first })}>
      <div className={styles['title-container']}>
        <span className={styles['hash']}>#</span>
        <span className={styles['title']}>{title}</span>
      </div>
      {children}
    </h2>
  );
};

export default DocSectionTitle;
