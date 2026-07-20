import { KeyOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.module.less';

interface CardSecretModalProps {
  open: boolean;
  /** 当前已绑定的卡密（编辑时回填） */
  value?: string;
  /** 是否允许关闭（无卡密时首次提醒可设为 false） */
  closable?: boolean;
  onCancel?: () => void;
  onConfirm: (cardSecret: string) => void;
}

/**
 * 卡密输入弹窗（假校验：非空即可）
 */
const CardSecretModal: React.FC<CardSecretModalProps> = ({
  open,
  value = '',
  closable = true,
  onCancel,
  onConfirm,
}) => {
  const [input, setInput] = useState(value);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setInput(value);
      setError('');
    }
  }, [open, value]);

  const handleConfirm = () => {
    const next = input.trim();
    if (!next) {
      setError('请输入卡密');
      return;
    }
    onConfirm(next);
  };

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      centered
      width={420}
      destroyOnHidden
      closable={closable}
      maskClosable={closable}
      keyboard={closable}
      onCancel={onCancel}
      className={styles['modal']}
      styles={{
        body: { padding: 0 },
      }}>
      <div className={styles['body']}>
        <div className={styles['icon']} aria-hidden='true'>
          <KeyOutlined />
        </div>
        <h2 className={styles['title']}>{value ? '更换卡密' : '绑定卡密'}</h2>
        <p className={styles['desc']}>输入卡密后即可使用解析与下载功能。</p>

        <label className={styles['field']} htmlFor='card-secret-input'>
          <span className={styles['label']}>卡密</span>
          <div className={styles['inputWrap']}>
            <KeyOutlined aria-hidden='true' />
            <input
              id='card-secret-input'
              className={styles['input']}
              type='text'
              autoComplete='off'
              autoFocus
              placeholder='请输入卡密'
              value={input}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'card-secret-error' : undefined}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
            />
          </div>
          {error ? (
            <span id='card-secret-error' className={styles['error']} role='alert'>
              {error}
            </span>
          ) : null}
        </label>

        <div className={styles['actions']}>
          {closable ? (
            <button className={styles['btnGhost']} type='button' onClick={onCancel}>
              稍后再说
            </button>
          ) : null}
          <button className={styles['btnPrimary']} type='button' onClick={handleConfirm}>
            确认绑定
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CardSecretModal;

/** 卡密脱敏展示 */
export const maskCardSecret = (secret: string) => {
  const text = secret.trim();
  if (text.length <= 4) return '****';
  return `****${text.slice(-4)}`;
};
