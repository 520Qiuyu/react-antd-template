import styles from './index.module.less';

interface ParseEmptyStateProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

interface ParseErrorStateProps {
  message: string;
}

/**
 * 解析空状态
 */
export const ParseEmptyState: React.FC<ParseEmptyStateProps> = ({ icon, children }) => {
  return (
    <div className={styles['empty']} aria-live='polite'>
      {icon}
      {children}
    </div>
  );
};

/**
 * 解析错误状态
 */
export const ParseErrorState: React.FC<ParseErrorStateProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className={styles['error']} role='alert'>
      {message}
    </div>
  );
};
