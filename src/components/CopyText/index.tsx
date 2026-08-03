import copy from '@/utils/copy';
import { msgError, msgSuccess } from '@/utils/modal';
import { CopyOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import TextOverflowShowTips from '../TextOverflowShowTips';
import styles from './style.module.less';

interface CopyTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 需要显示和复制的文本
   */
  text: string;
  /**
   * 要显示的文本，默认与text一致
   */
  showText?: string;
}

/**
 * 文本复制组件
 * @description 显示一段文本，并提供复制按钮，点击可复制到剪贴板
 * @example
 * ```tsx
 * <CopyText text="这是一段可以复制的文本" />
 * ```
 */
export default function CopyText(props: CopyTextProps) {
  const { text,showText, className, ...rest } = props;

  const handleCopy = async () => {
    try {
      await copy(text);
      msgSuccess('复制成功');
    } catch (error) {
      console.log('error', error);
      msgError(error instanceof Error ? error.message : '复制失败，请重试');
    }
  };

  return (
    <div className={classNames(styles['copy-text'], className)} {...rest}>
      <TextOverflowShowTips
        text={showText || text}
        tooltipProps={{
          getPopupContainer: () => {
            return document.body;
          },
        }}
      />
      <CopyOutlined onClick={handleCopy} className={styles['copy-btn']} />
    </div>
  );
}
