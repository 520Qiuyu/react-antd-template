import { CopyText } from '@/components';
import { Status } from '@/constants';
import type { CardSecretListItem, CardSecretType } from '@/types/cardSecret';
import { CARD_SECRET_TYPE_TEXT_MAP } from '@/views/qishui/cardSecret/constants';
import {
  getLegacyValidDays,
  getValidDaysExpireAt,
} from '@/views/qishui/cardSecret/utils/cardSecretTime';
import { Switch } from 'antd';
import classNames from 'classnames';
import dayjs, { type Dayjs } from 'dayjs';
import styles from './index.module.less';

interface Props {
  record: CardSecretListItem;
  index: number;
  onCopyText: (record: CardSecretListItem) => void;
  onEdit: (record: CardSecretListItem) => void;
  onDelete: (record: CardSecretListItem) => void;
  onStatusChange: (record: CardSecretListItem, checked: boolean) => void;
}

const formatTime = (val?: string | null | Dayjs) =>
  val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-';

/**
 * 移动端卡密列表项（Apple 信息层级：卡密优先，用量层次分明）
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
  const {
    validDays,
    enableTime,
    expireTime,
    ctime,
    type,
    dailyParseLimit,
    dailyParsedCount,
    parseLimit,
    parsedCount,
  } = record;
  /** 是否配置了有效天数 新字段 */
  const hasConfiguredValidDays = validDays != null && validDays > 0;
  /** 启用时间 */
  const enableAt = hasConfiguredValidDays ? dayjs(enableTime) : dayjs(record.ctime);
  /** 过期时间 */
  const expireAt = hasConfiguredValidDays
    ? getValidDaysExpireAt(enableTime, validDays)
    : dayjs(expireTime);
  /** 可使用天数 */
  const calcValidDays = hasConfiguredValidDays ? validDays : getLegacyValidDays(ctime, expireTime);

  /** 是否限制每日用量 */
  const hasDailyLimit = dailyParseLimit != null && dailyParseLimit > 0;
  /** 每日用量 */
  const dailyUsed = dailyParsedCount ?? 0;
  /** 每日用量限制 */
  const dailyLimit = dailyParseLimit || 0;
  /** 每日用量百分比 */
  const dailyPercent = hasDailyLimit
    ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 1000) / 10)
    : 0;
  /** 每日用量剩余 */
  const dailyRemain = hasDailyLimit ? Math.max(0, dailyLimit - dailyUsed) : null;
  /** 是否限制总用量 */
  const hasTotalLimit = type === 'count' && (parseLimit || 0) > 0;
  /** 总用量 */
  const totalUsed = parsedCount || 0;
  /** 总用量限制 */
  const totalLimit = parseLimit || 0;
  /** 总用量剩余 */
  const totalRemain = hasTotalLimit ? Math.max(0, totalLimit - totalUsed) : null;
  /** 总用量百分比 */
  const totalPercent = hasTotalLimit
    ? Math.min(100, Math.round((totalUsed / totalLimit) * 1000) / 10)
    : 0;

  const dailyIsPrimary = hasDailyLimit && type === 'time';
  const auth = record.authInfo;
  const hasAuth = Boolean(auth?.deviceId || auth?.cookie);
  const isEnabled = record.status === Status.NORMAL;

  const handleCopyText = () => onCopyText(record);
  const handleEdit = () => onEdit(record);
  const handleDelete = () => onDelete(record);
  const handleStatusChange = (checked: boolean) => onStatusChange(record, checked);

  return (
    <article
      className={classNames(styles['card'], {
        [styles['cardTypeTime']]: type === 'time',
        [styles['cardTypeCount']]: type === 'count',
      })}
      aria-label={`卡密 ${record.secret}`}>
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
            <span
              className={classNames(styles['chip'], {
                [styles['chipTypeTime']]: type === 'time',
                [styles['chipTypeCount']]: type === 'count',
              })}>
              {CARD_SECRET_TYPE_TEXT_MAP[type]}
            </span>
          </div>
        </div>

        <div className={styles['secretBlock']}>
          <span className={styles['secretLabel']}>卡号</span>
          <div className={styles['secretRow']}>
            <CopyText text={record.secret} className={styles['secretText']} />
          </div>
        </div>
      </header>

      <div className={styles['usageCard']} aria-label='解析用量'>
        {hasDailyLimit ? (
          <div
            className={classNames(styles['usageBlock'], {
              [styles['usagePrimary']]: dailyIsPrimary,
              [styles['usageSecondary']]: !dailyIsPrimary,
            })}>
            <div className={styles['usageHead']}>
              <span className={styles['usageLabel']}>今日</span>
              {dailyRemain !== null ? (
                <span className={styles['usageHint']}>剩 {dailyRemain}</span>
              ) : null}
            </div>
            <div className={styles['usageValue']}>
              <strong>{dailyUsed}</strong>
              <span className={styles['usageDenom']}>/ {dailyLimit}</span>
            </div>
            <div
              className={styles['usageTrack']}
              role='progressbar'
              aria-valuenow={dailyPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label='今日解析进度'>
              <div
                className={classNames(styles['usageFill'], {
                  [styles['usageFillWarn']]: dailyPercent >= 90,
                })}
                style={{ width: `${dailyPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <div
          className={classNames(styles['usageBlock'], {
            [styles['usagePrimary']]: !dailyIsPrimary,
            [styles['usageSecondary']]: dailyIsPrimary,
            [styles['usageFollow']]: hasDailyLimit,
          })}>
          <div className={styles['usageHead']}>
            <span className={styles['usageLabel']}>总解析</span>
            {totalRemain !== null ? (
              <span className={styles['usageHint']}>剩 {totalRemain}</span>
            ) : null}
          </div>
          <div className={styles['usageValue']}>
            <strong>{totalUsed}</strong>
            {hasTotalLimit ? <span className={styles['usageDenom']}>/ {totalLimit}</span> : null}
          </div>
          {hasTotalLimit ? (
            <div
              className={styles['usageTrack']}
              role='progressbar'
              aria-valuenow={totalPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label='总解析进度'>
              <div
                className={classNames(styles['usageFill'], {
                  [styles['usageFillWarn']]: totalPercent >= 90,
                })}
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>

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
          <span className={styles['label']}>首次使用时间</span>
          <span className={styles['value']}>{enableAt ? formatTime(enableAt) : '未启用'}</span>
        </div>

        <div className={styles['row']}>
          <span className={styles['label']}>过期时间</span>
          <span className={styles['value']}>{expireAt ? formatTime(expireAt) : '未启用'}</span>
        </div>

        <div className={styles['row']}>
          <span className={styles['label']}>有效期</span>
          <span className={styles['value']}>
            {calcValidDays != null ? `${calcValidDays} 天` : '-'}
          </span>
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
        <button
          type='button'
          className={styles['actionBtn']}
          onClick={handleEdit}
          aria-label='编辑此卡密'>
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
