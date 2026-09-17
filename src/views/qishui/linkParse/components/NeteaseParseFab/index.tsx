import wangyiyunIcon from '@/assets/images/wangyiyun.svg';
import styles from './index.module.less';

interface NeteaseParseFabProps {
  href: string;
}

/**
 * 右下角网易云解析入口，与使用教程 FAB 同列堆叠
 * @example
 * ```tsx
 * <NeteaseParseFab href={neteaseParseHref} />
 * ```
 */
const NeteaseParseFab: React.FC<NeteaseParseFabProps> = ({ href }) => {
  return (
    <a
      className={styles['fab']}
      href={href}
      aria-label='切换到网易云解析'
      tabIndex={0}>
      <img src={wangyiyunIcon} alt='' />
    </a>
  );
};

export default NeteaseParseFab;
