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
 * @example
 * ```tsx
 * <DocSectionTitle title='输入链接' id='parse-input' first>
 *   <ParseFormPanel ... />
 * </DocSectionTitle>
 * ```
 */
const DocSectionTitle: React.FC<DocSectionTitleProps> = ({ id, children, first, title }) => {
  return (
    <div id={id} className={classNames(styles['sectionTitle'], { [styles['first']]: first })}>
      <div className={styles['title-container']}>
        <span className={styles['hash']}>#</span>
        <span className={styles['title']}>{title}</span>
      </div>
      {children}
    </div>
  );
};

export default DocSectionTitle;
