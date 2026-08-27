import eventBus from '@/utils/eventBus';
import { msgError } from '@/utils/modal';
import { EditOutlined, KeyOutlined, ReloadOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useParseStore } from '../../store';
import { maskCardSecret } from '../CardSecretModal';
import styles from './index.module.less';
import { useSearchParams } from '@/hooks/useSearchParams';
import { getValidDaysExpireAt } from '@/views/cardSecret/utils/cardSecretTime';

/**
 * 侧栏卡密信息卡片（直接读取 parseStore）
 * @example
 * ```tsx
 * <CardSecretPanel />
 * ```
 */
const CardSecretPanel: React.FC = () => {
  const { searchParams } = useSearchParams<{ cardSecret?: string }>();
  const cardSecret = useParseStore((state) => state.cardSecret);
  const getCardSecret = useParseStore((state) => state.getCardSecret);
  const [refreshing, setRefreshing] = useState(false);

  const handleEdit = () => {
    eventBus.emit('cardSecretChange', 'edit');
  };

  /**
   * 重新拉取当前卡密详情并更新面板（防抖，避免短时间重复刷新）
   * @example
   * ```ts
   * handleRefresh();
   * ```
   */
  const { run: handleRefresh } = useDebounceFn(
    async () => {
      if (!searchParams.cardSecret || refreshing) return;
      try {
        setRefreshing(true);
        const data = await getCardSecret(searchParams.cardSecret);
        if (!data) {
          msgError('刷新卡密信息失败');
        }
      } catch (error) {
        console.log('error', error);
        msgError(error instanceof Error ? error.message : '刷新卡密信息失败');
      } finally {
        setRefreshing(false);
      }
    },
    { wait: 400 },
  );

  useEffect(() => {
    eventBus.on('cardSecretRefresh', handleRefresh);
    return () => {
      eventBus.off('cardSecretRefresh', handleRefresh);
    };
  }, [handleRefresh]);

  if (!cardSecret) {
    return (
      <div className={`${styles['secretCard']} ${styles['isEmpty']}`} aria-label='卡密信息'>
        <div className={styles['secretIcon']} aria-hidden='true'>
          <KeyOutlined />
        </div>
        <h4 className={styles['secretTitle']}>未绑定卡密</h4>
        <p className={styles['secretDesc']}>绑定后可查看额度与到期信息，解锁解析能力。</p>
      </div>
    );
  }

  const isTime = cardSecret.type === 'time';
  const isNormal = cardSecret.status === 'normal';
  const masked = maskCardSecret(cardSecret.secret);

  const refreshBtn = (
    <button
      type='button'
      className={styles['refreshBtn']}
      aria-label='刷新卡密信息'
      disabled={refreshing}
      onClick={handleRefresh}>
      <ReloadOutlined spin={refreshing} aria-hidden='true' />
    </button>
  );

  let cardBody: React.ReactNode;

  if (isTime) {
    const { validDays, expireTime, enableTime } = cardSecret;
    const hasConfiguredValidDays = validDays != null && validDays > 0;
    const expireAt = hasConfiguredValidDays
      ? getValidDaysExpireAt(enableTime, validDays)
      : dayjs(expireTime);
    const now = dayjs();
    const isExpired = expireAt ? expireAt.isBefore(now) : false;
    const remainDays = expireAt ? Math.max(0, expireAt.diff(now, 'day')) : null;
    const remainHours =
      expireAt && remainDays === 0 ? Math.max(0, expireAt.diff(now, 'hour')) : null;
    const dailyLimit = cardSecret.dailyParseLimit;
    const dailyUsed = cardSecret.dailyParsedCount ?? 0;
    const dailyExhausted = dailyLimit != null && dailyLimit > 0 && dailyUsed >= dailyLimit;
    const stateLabel = !isNormal
      ? '已禁用'
      : isExpired
        ? '已过期'
        : dailyExhausted
          ? '今日已达上限'
          : '有效中';
    const stateTone = !isNormal || isExpired || dailyExhausted ? 'bad' : 'ok';

    cardBody = (
      <div
        className={`${styles['secretCard']} ${styles['isTime']} ${stateTone === 'bad' ? styles['isWarn'] : ''}`}
        aria-label='卡密信息'>
        <div className={styles['secretHead']}>
          <span className={`${styles['typeBadge']} ${styles['typeTime']}`}>按时长</span>
          <div className={styles['secretHeadRight']}>
            <span className={`${styles['stateBadge']} ${styles[stateTone]}`}>{stateLabel}</span>
            {refreshBtn}
          </div>
        </div>

        <div className={styles['secretCode']}>
          <KeyOutlined aria-hidden='true' />
          <code>{masked}</code>
          {/* edit icon */}
          <EditOutlined className={styles['editIcon']} onClick={handleEdit} />
        </div>

        <div className={`${styles['stateBanner']} ${styles[stateTone]}`} role='status'>
          <span className={styles['stateBannerDot']} aria-hidden />
          <span>
            {isExpired
              ? '卡密已过期，无法继续解析'
              : !isNormal
                ? '卡密已禁用，请更换后使用'
                : dailyExhausted
                  ? '今日解析次数已达上限，请明天再试'
                  : remainDays !== null && remainDays > 0
                    ? `有效期内，剩余 ${remainDays} 天`
                    : remainHours !== null
                      ? `即将到期，剩余约 ${remainHours} 小时`
                      : '卡密有效，可正常解析'}
          </span>
        </div>

        <div className={styles['metricBlock']}>
          <div className={styles['metricLabel']}>到期时间</div>
          <div className={styles['metricValue']}>
            {expireAt ? expireAt.format('YYYY-MM-DD HH:mm') : '未启用'}
          </div>
        </div>

        {dailyLimit != null && dailyLimit > 0 ? (
          <div className={styles['metricBlock']}>
            <div className={styles['metricLabel']}>今日解析</div>
            <div className={styles['metricValue']}>
              {dailyUsed} / {dailyLimit}
            </div>
          </div>
        ) : null}

        {expireAt && (
          <div className={styles['timeBar']} aria-hidden>
            <div
              className={`${styles['timeBarFill']} ${isExpired ? styles['isFull'] : ''}`}
              style={{ width: `${isExpired ? 100 : calcTimeProgress(expireAt)}%` }}
            />
          </div>
        )}
      </div>
    );
  } else {
    const limit = Math.max(cardSecret.parseLimit || 0, 0);
    const used = Math.max(cardSecret.parsedCount || 0, 0);
    const remain = Math.max(limit - used, 0);
    const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 1000) / 10) : 0;
    const depleted = limit > 0 && remain <= 0;
    const stateLabel = !isNormal ? '已禁用' : depleted ? '已解析完毕' : '可解析';
    const stateTone = !isNormal || depleted ? 'bad' : 'ok';

    cardBody = (
      <div
        className={`${styles['secretCard']} ${styles['isCount']} ${stateTone === 'bad' ? styles['isWarn'] : ''}`}
        aria-label='卡密信息'>
        <div className={styles['secretHead']}>
          <span className={`${styles['typeBadge']} ${styles['typeCount']}`}>按次数</span>
          <div className={styles['secretHeadRight']}>
            <span className={`${styles['stateBadge']} ${styles[stateTone]}`}>{stateLabel}</span>
            {refreshBtn}
          </div>
        </div>

        <div className={styles['secretCode']}>
          <KeyOutlined aria-hidden='true' />
          <code>{masked}</code>
          {/* edit icon */}
          <EditOutlined className={styles['editIcon']} onClick={handleEdit} />
        </div>

        <div className={`${styles['stateBanner']} ${styles[stateTone]}`} role='status'>
          <span className={styles['stateBannerDot']} aria-hidden />
          <span>
            {depleted
              ? '解析次数已用尽，无法继续解析'
              : !isNormal
                ? '卡密已禁用，请更换后使用'
                : `还可解析 ${remain} 次`}
          </span>
        </div>

        <div className={styles['countRow']}>
          <div className={styles['countItem']}>
            <span className={styles['countNum']}>{used}</span>
            <span className={styles['countLabel']}>已用</span>
          </div>
          <div className={styles['countDivider']} aria-hidden />
          <div className={styles['countItem']}>
            <span className={styles['countNum']}>{remain}</span>
            <span className={styles['countLabel']}>剩余</span>
          </div>
          <div className={styles['countDivider']} aria-hidden />
          <div className={styles['countItem']}>
            <span className={styles['countNum']}>{limit}</span>
            <span className={styles['countLabel']}>总额</span>
          </div>
        </div>

        <div className={styles['progressWrap']}>
          <div className={styles['progressMeta']}>
            <span>使用进度</span>
            <span>{percent}%</span>
          </div>
          <div
            className={styles['progressBar']}
            role='progressbar'
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}>
            <div
              className={`${styles['progressFill']} ${depleted ? styles['isFull'] : ''}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Spin spinning={refreshing} wrapperClassName={styles['secretSpin']}>
      {cardBody}
    </Spin>
  );
};

export default CardSecretPanel;

/**
 * 估算时长卡密进度（假设有效期最长 90 天向前看，仅作视觉参考）
 * @example
 * ```ts
 * calcTimeProgress(dayjs().add(30, 'day')) // ~67
 * ```
 */
const calcTimeProgress = (expire: dayjs.Dayjs) => {
  const totalDays = 90;
  const remain = Math.max(0, expire.diff(dayjs(), 'day', true));
  const usedRatio = 1 - Math.min(remain / totalDays, 1);
  return Math.round(usedRatio * 1000) / 10;
};
