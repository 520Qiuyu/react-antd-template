import { reqGetCardSecretBySecret } from '@/apis';
import { useSearchParams, useVisible } from '@/hooks';
import { useParseStore } from '@/store';
import eventBus from '@/utils/eventBus';
import { KeyOutlined } from '@ant-design/icons';
import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.module.less';

export type CardSecretModalTheme = 'qishui' | 'netease';

interface CardSecretModalProps {
  /** 配色主题：汽水绿 / 网易红 */
  theme?: CardSecretModalTheme;
}

/**
 * 卡密脱敏展示
 * @example
 * maskCardSecret('ABCD1234') // '****1234'
 */
export const maskCardSecret = (secret: string) => {
  const text = secret.trim();
  if (text.length <= 4) return '****';
  return `****${text.slice(-4)}`;
};

/**
 * 卡密绑定弹窗
 * @example
 * ```tsx
 * <CardSecretModal theme='netease' />
 * ```
 */
const CardSecretModal: React.FC<CardSecretModalProps> = ({ theme = 'qishui' }) => {
  const { searchParams, setSearchParams } = useSearchParams<{ cardSecret?: string }>();
  const [input, setInput] = useState(searchParams.cardSecret || '');
  const { visible, open, close } = useVisible();
  const { setCardSecret } = useParseStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 根据 URL 中的卡密拉取详情
   * @example
   * ```ts
   * await getCardSecret('XXXX-XXXX');
   * ```
   */
  const getCardSecret = async (secret: string) => {
    setLoading(true);
    try {
      const res = await reqGetCardSecretBySecret(secret);
      if (res.code !== 200 || !res.data) {
        setCardSecret(undefined);
        setError(res.message || '卡密无效');
        open();
        return;
      }
      setCardSecret(res.data);
      setError('');
    } catch (err) {
      console.log('error', err);
      setCardSecret(undefined);
      setError('卡密校验失败');
      open();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const secret = searchParams.cardSecret?.trim();
    if (!secret) {
      setCardSecret(undefined);
      open();
      return;
    }
    setInput(secret);
    getCardSecret(secret);
  }, [searchParams.cardSecret]);

  const handleConfirm = async () => {
    const next = input.trim();
    if (!next) {
      setError('请输入卡密');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await reqGetCardSecretBySecret(next);
      if (res.code !== 200 || !res.data) {
        setError(res.message || '卡密无效');
        return;
      }
      setCardSecret(res.data);
      setSearchParams((prev) => ({ ...prev, cardSecret: next }));
      close();
    } catch (err) {
      console.log('error', err);
      setError('卡密校验失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCardSecretChange = () => {
      open();
    };
    eventBus.on('cardSecretChange', handleCardSecretChange);
    return () => {
      eventBus.off('cardSecretChange', handleCardSecretChange);
    };
  }, []);

  return (
    <Modal
      open={visible}
      title={null}
      footer={null}
      centered
      width={420}
      destroyOnHidden
      mask={{
        closable: false,
      }}
      closable={searchParams.cardSecret ? true : false}
      keyboard={false}
      onCancel={close}
      className={styles['modal']}
      styles={{
        body: { padding: 0 },
        container: { padding: 0 },
      }}>
      <div className={styles['body']} data-theme={theme}>
        <div className={styles['icon']} aria-hidden='true'>
          <KeyOutlined />
        </div>
        <h2 className={styles['title']}>{searchParams.cardSecret ? '更换卡密' : '绑定卡密'}</h2>
        <p className={styles['desc']}>输入卡密后即可使用解析与下载功能。</p>

        <label className={styles['field']} htmlFor='card-secret-input'>
          <span className={styles['label']}>卡密</span>
          <Input
            id='card-secret-input'
            className={styles['input']}
            allowClear
            autoComplete='off'
            autoFocus
            placeholder='请输入卡密'
            value={input}
            disabled={loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'card-secret-error' : undefined}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleConfirm();
            }}
          />
          {error ? (
            <span id='card-secret-error' className={styles['error']} role='alert'>
              {error}
            </span>
          ) : null}
        </label>

        <div className={styles['actions']}>
          <button
            className={styles['btnPrimary']}
            type='button'
            disabled={loading}
            onClick={handleConfirm}>
            {loading ? '校验中...' : '确认绑定'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CardSecretModal;
