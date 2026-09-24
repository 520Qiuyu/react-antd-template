import qqCoderImage from '@/assets/images/qq_coder.jpg';
import { msgError, msgSuccess } from '@/utils/modal';
import { CloseOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { GROUP_JOIN_NAME, GROUP_JOIN_NUMBER, GROUP_JOIN_SEEN_KEY } from '../../constants';
import styles from './index.module.less';

const EXIT_MS = 320;

/**
 * 右下角加群入口。点击在屏幕正中打开售后群二维码；首次进入页面默认弹出一次。
 * @example
 * ```tsx
 * <GroupJoinFab />
 * ```
 */
const GroupJoinFab: React.FC = () => {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(GROUP_JOIN_SEEN_KEY, '1');
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const handleOpen = useCallback(() => {
    setMounted(true);
    window.requestAnimationFrame(() => {
      setOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    markSeen();
  }, [markSeen]);

  const handleCopyGroupNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(GROUP_JOIN_NUMBER);
      msgSuccess('群号已复制');
    } catch {
      msgError('复制失败，请长按群号手动复制');
    }
  }, []);

  const handleScrimClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(GROUP_JOIN_SEEN_KEY) === '1';
    } catch {
      seen = false;
    }
    if (seen) return;
    handleOpen();
  }, [handleOpen]);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  return (
    <>
      <button
        className={styles['fab']}
        type='button'
        aria-label='加入售后群'
        aria-haspopup='dialog'
        aria-expanded={open}
        tabIndex={0}
        onClick={handleOpen}>
        <CustomerServiceOutlined />
      </button>

      {mounted
        ? createPortal(
            <div
              className={classNames(styles['scrim'], { [styles['isOpen']]: open })}
              role='presentation'
              onClick={handleScrimClick}>
              <div
                className={classNames(styles['dialog'], { [styles['isOpen']]: open })}
                role='dialog'
                aria-modal='true'
                aria-labelledby={titleId}>
                <h2 className={styles['title']} id={titleId}>
                  {GROUP_JOIN_NAME}
                </h2>
                <button
                  className={styles['close']}
                  type='button'
                  aria-label='关闭加群弹窗'
                  tabIndex={0}
                  onClick={handleClose}>
                  <CloseOutlined />
                </button>

                <div className={styles['qrFrame']}>
                  <img
                    className={styles['qr']}
                    src={qqCoderImage}
                    alt={`${GROUP_JOIN_NAME}二维码，群号 ${GROUP_JOIN_NUMBER}`}
                  />
                </div>

                <button
                  className={styles['copy']}
                  type='button'
                  aria-label={`复制群号 ${GROUP_JOIN_NUMBER}`}
                  tabIndex={0}
                  onClick={handleCopyGroupNumber}>
                  <span>群号</span>
                  <strong>{GROUP_JOIN_NUMBER}</strong>
                  <em>复制</em>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default GroupJoinFab;
