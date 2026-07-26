import { CopyText } from '@/components';
import { Status } from '@/constants';
import type { CardSecretListItem, CardSecretType } from '@/types/cardSecret';
import { CARD_SECRET_TYPE_TEXT_MAP } from '@/views/qishui/cardSecret/constants';
import { Switch } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.less';

interface Props {
  record: CardSecretListItem;
  index: number;
  onCopyText: (record: CardSecretListItem) => void;
  onEdit: (record: CardSecretListItem) => void;
  onDelete: (record: CardSecretListItem) => void;
  onStatusChange: (record: CardSecretListItem, checked: boolean) => void;
}

const formatTime = (val?: string | null) =>
  val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-';

/**
 * 移动端卡密列表项（Apple 信息层级：卡密优先）
 * @example
 * ```tsx
 * <CardSecretMobileItem
 *   record={item}
 *   index={1}
 *   onCopyText={handleCopy}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onStatusChange={handleStatusChange}
 * />
 * ```
 */
const CardSecretMobileItem: React.FC<Props> = ({
  record,
  index,
  onCopyText,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const type = record.type as CardSecretType;
  const totalCount = record.parseLimit || record.parsedCount + record.unparsedCount;
  const percent = totalCount > 0 ? (record.parsedCount / totalCount) * 100 : 0;
  const auth = record.authInfo;
  const hasAuth = Boolean(auth?.deviceId || auth?.cookie);
  const isEnabled = record.status === Status.NORMAL;

  const handleCopyText = () => onCopyText(record);
  const handleEdit = () => onEdit(record);
  const handleDelete = () => onDelete(record);
  const handleStatusChange = (checked: boolean) => onStatusChange(record, checked);

  return (
    <article className={styles['card']} aria-label={`卡密 ${record.secret}`}>
      <header className={styles['hero']}>
        <div className={styles['heroTop']}>
          <span className={styles['index']} aria-hidden>
            {index}
          </span>
          <div className={styles['chips']}>
            <span
              className={classNames(
                styles['chip'],
                isEnabled ? styles['chipOk'] : styles['chipOff'],
              )}>
              {isEnabled ? '正常' : '禁用'}
            </span>
            <span className={styles['chip']}>{CARD_SECRET_TYPE_TEXT_MAP[type]}</span>
          </div>
        </div>

        <div className={styles['secretBlock']}>
          <span className={styles['secretLabel']}>卡号</span>
          <div className={styles['secretRow']}>
            <CopyText text={record.secret} className={styles['secretText']} />
          </div>
        </div>
      </header>

      <div className={styles['group']}>
        <div className={styles['row']}>
          <span className={styles['label']}>启用</span>
          <div className={styles['statusRow']}>
            <span className={styles['statusText']}>{isEnabled ? '开启' : '关闭'}</span>
            <Switch
              size='small'
              checked={isEnabled}
              onChange={handleStatusChange}
              aria-label={isEnabled ? '禁用卡密' : '启用卡密'}
            />
          </div>
        </div>

        <div className={styles['row']}>
          <span className={styles['label']}>解析进度</span>
          <div className={styles['parse']}>
            <div className={styles['parseText']}>
              <strong>{record.parsedCount}</strong>
              <span>/</span>
              <em>{record.unparsedCount}</em>
            </div>
            <div className={styles['parseBar']} aria-hidden>
              <div className={styles['parseBarFill']} style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>

        <div className={styles['row']}>
          <span className={styles['label']}>过期时间</span>
          <span className={styles['value']}>{formatTime(record.expireTime)}</span>
        </div>

        <div className={styles['row']}>
          <span className={styles['label']}>创建者</span>
          <span className={styles['value']}>{record.createUser?.account || '-'}</span>
        </div>
      </div>

      <details className={styles['more']}>
        <summary className={styles['moreSummary']}>更多信息</summary>
        <div className={styles['group']}>
          <div className={styles['row']}>
            <span className={styles['label']}>ID</span>
            <span className={classNames(styles['value'], styles['mono'])}>{record.id}</span>
          </div>
          <div className={styles['row']}>
            <span className={styles['label']}>认证信息</span>
            <span className={styles['value']}>
              {hasAuth ? (
                <CopyText text={auth?.deviceId || auth?.cookie || '已配置'} />
              ) : (
                <span className={styles['muted']}>未配置</span>
              )}
            </span>
          </div>
          <div className={styles['row']}>
            <span className={styles['label']}>备注</span>
            <span className={styles['value']}>{record.remark || '-'}</span>
          </div>
          <div className={styles['row']}>
            <span className={styles['label']}>创建时间</span>
            <span className={styles['value']}>{formatTime(record.ctime)}</span>
          </div>
          <div className={styles['row']}>
            <span className={styles['label']}>更新时间</span>
            <span className={styles['value']}>{formatTime(record.utime)}</span>
          </div>
        </div>
      </details>

      <footer className={styles['footer']}>
        <button
          type='button'
          className={styles['actionBtn']}
          onClick={handleCopyText}
          aria-label='复制卡密发货文本'>
          复制文本
        </button>
        <button type='button' className={styles['actionBtn']} onClick={handleEdit} aria-label='编辑此卡密'>
          编辑
        </button>
        <button
          type='button'
          className={classNames(styles['actionBtn'], styles['actionDanger'])}
          onClick={handleDelete}
          aria-label='删除此卡密'>
          删除
        </button>
      </footer>
    </article>
  );
};

export default CardSecretMobileItem;
