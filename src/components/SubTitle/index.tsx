import classNames from 'classnames';
import styles from './style.module.less';
export default function SubTitle(props: Props) {
  const { title, className, children, ...other } = props;
  return (
    <div className={classNames(styles['littleTitle'], className)} {...other}>
      {title}
      {children}
    </div>
  );
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  className?: string;
  children?: React.ReactNode;
}
