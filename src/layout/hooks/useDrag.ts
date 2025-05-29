import { useCallback, useEffect, useState } from 'react';

export interface IOptions {
  /** 最小宽度 */
  minWidth?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 拖拽开始回调 */
  onDragStart?: (e: React.MouseEvent) => void;
  /** 拖拽中回调 */
  onDrag?: (width: number) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (e: React.MouseEvent) => void;
}

export const useDrag = (options: IOptions = {}) => {
  const { minWidth = 150, maxWidth = 600, onDragStart, onDrag, onDragEnd } = options;

  const [isDragging, setIsDragging] = useState(false);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.(e);
    e.preventDefault();
  };

  // 处理拖拽
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          onDrag?.(newWidth);
        }
      }
    },
    [isDragging, minWidth, maxWidth, onDrag],
  );

  // 处理拖拽结束
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd?.(e as any);
      }
    },
    [isDragging, onDragEnd],
  );

  // 添加和移除事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    handleMouseDown,
  };
};
