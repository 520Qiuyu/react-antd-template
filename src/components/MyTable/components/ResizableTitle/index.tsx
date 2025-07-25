import { Resizable } from 'react-resizable';
import styles from './index.module.less';

interface ResizableTitleProps {
  onResize: (e: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => void;
  width: number;
  [key: string]: any;
}

const ResizableTitle = (props: ResizableTitleProps) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className={styles['react-resizable-handle']}
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export default ResizableTitle;
