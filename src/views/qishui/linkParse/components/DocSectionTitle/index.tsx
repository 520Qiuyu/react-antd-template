import classNames from 'classnames';
import styles from './index.module.less';

interface DocSectionTitleProps {
  id: string;
  children: React.ReactNode;
  first?: boolean;
}

/**
 * 文档区块标题
 */
const DocSectionTitle: React.FC<DocSectionTitleProps> = ({ id, children, first }) => {
  return (
    <h2
      id={id}
      className={classNames(styles['sectionTitle'], { [styles['first']]: first })}>
      <span className={styles['hash']}>#</span>
      {children}
    </h2>
  );
};

export default DocSectionTitle;
