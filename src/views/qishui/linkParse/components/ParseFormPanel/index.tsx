import {
  InfoCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import styles from './index.module.less';

interface ParseFormPanelProps {
  hint: React.ReactNode;
  label: string;
  inputId: string;
  placeholder: string;
  value: string;
  loading: boolean;
  submitLabel: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

/**
 * 链接解析表单面板
 */
const ParseFormPanel: React.FC<ParseFormPanelProps> = ({
  hint,
  label,
  inputId,
  placeholder,
  value,
  loading,
  submitLabel,
  ariaLabel,
  onChange,
  onSubmit,
  onClear,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className={styles['panel']} aria-label={ariaLabel}>
      <p className={styles['hint']}>
        <InfoCircleOutlined />
        <span>{hint}</span>
      </p>
      <form className={styles['form']} onSubmit={handleSubmit}>
        <div>
          <label className={styles['label']} htmlFor={inputId}>
            {label}
          </label>
          <div className={styles['field']}>
            <LinkOutlined aria-hidden='true' />
            <input
              className={styles['input']}
              id={inputId}
              type='text'
              name='shareLink'
              autoComplete='off'
              placeholder={placeholder}
              value={value}
              aria-label={label}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
        </div>
        <div className={styles['actions']}>
          <button
            className={classNames(styles['btn'], styles['btnPrimary'], {
              [styles['isLoading']]: loading,
            })}
            type='submit'
            disabled={loading}
            aria-label={submitLabel}>
            {loading ? (
              <>
                <span className={styles['spin']} aria-hidden='true' />
                <span>解析中…</span>
              </>
            ) : (
              <>
                <SearchOutlined />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
          <button
            className={classNames(styles['btn'], styles['btnGhost'])}
            type='button'
            aria-label='清空'
            onClick={onClear}>
            <ReloadOutlined />
            清空
          </button>
        </div>
      </form>
    </section>
  );
};

export default ParseFormPanel;
