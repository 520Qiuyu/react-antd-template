import { CloseOutlined, PlayCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HELP_DOC_URL, HELP_TIP_SEEN_KEY } from '../../constants';
import styles from './index.module.less';

const AUTO_COLLAPSE_MS = 10000;

/**
 * 右下角使用教程帮助浮层
 * @example
 * ```tsx
 * <HelpFab />
 * ```
 */
const HelpFab: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const markTipSeen = useCallback(() => {
    try {
      localStorage.setItem(HELP_TIP_SEEN_KEY, '1');
    } catch {
      // ignore quota / private mode
    }
    setPulse(false);
  }, []);

  const handleClose = useCallback(() => {
    clearAutoTimer();
    setOpen(false);
    markTipSeen();
  }, [clearAutoTimer, markTipSeen]);

  const handleToggle = useCallback(() => {
    clearAutoTimer();
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        markTipSeen();
      }
      return next;
    });
  }, [clearAutoTimer, markTipSeen]);

  const handleOpenDoc = useCallback(() => {
    clearAutoTimer();
    markTipSeen();
    setOpen(false);
    window.open(HELP_DOC_URL, '_blank', 'noopener,noreferrer');
  }, [clearAutoTimer, markTipSeen]);

  // 首次访问：自动展开 + 呼吸光，约 4 秒后收起
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(HELP_TIP_SEEN_KEY) === '1';
    } catch {
      seen = false;
    }
    if (seen) return;

    setPulse(true);
    setOpen(true);

    autoTimerRef.current = window.setTimeout(() => {
      autoTimerRef.current = null;
      setOpen(false);
      markTipSeen();
    }, AUTO_COLLAPSE_MS);

    return () => clearAutoTimer();
  }, [clearAutoTimer, markTipSeen]);

  // Escape 关闭
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, handleClose]);

  return (
    <div className={styles['root']} ref={rootRef}>
      <div
        className={classNames(styles['panel'], { [styles['isOpen']]: open })}
        role='dialog'
        aria-label='使用教程'
        aria-hidden={!open}>
        <div className={styles['panelHead']}>
          <strong className={styles['panelTitle']}>使用教程</strong>
          <button
            className={styles['panelClose']}
            type='button'
            aria-label='关闭使用教程提示'
            tabIndex={open ? 0 : -1}
            onClick={handleClose}>
            <CloseOutlined />
          </button>
        </div>
        <p className={styles['panelDesc']}>图文说明 + 操作视频，快速上手解析流程</p>
        <button
          className={styles['panelCta']}
          type='button'
          tabIndex={open ? 0 : -1}
          onClick={handleOpenDoc}>
          <PlayCircleOutlined />
          查看教程
        </button>
      </div>

      <button
        className={classNames(styles['fab'], {
          [styles['isOpen']]: open,
          [styles['isPulse']]: pulse,
        })}
        type='button'
        aria-label={open ? '收起使用教程' : '打开使用教程'}
        aria-expanded={open}
        tabIndex={0}
        onClick={handleToggle}>
        <QuestionCircleOutlined />
      </button>
    </div>
  );
};

export default HelpFab;
