import type { CardSecretListItem } from '@/types/cardSecret';
import copy from '@/utils/copy';
import { confirm } from '@/utils/modal';
import dayjs from 'dayjs';
import { CARD_SECRET_TYPE_TEXT_MAP } from '../constants';

/**
 * 构建卡密发货文本
 * @example
 * ```ts
 * const text = buildCardSecretShipText(record);
 * ```
 */
export const buildCardSecretShipText = (record: CardSecretListItem) => {
  const { origin, pathname } = window.location;
  const { secret, type, expireTime, parseLimit, dailyParseLimit } = record;
  const isCount = type === 'count';
  const expireTimeText = expireTime ? dayjs(expireTime).format('YYYY-MM-DD HH:mm:ss') : '-';
  const parseLimitText = parseLimit ? `${parseLimit}次` : '-';
  const dailyLimitText =
    dailyParseLimit != null && dailyParseLimit > 0 ? `每日上限 ${dailyParseLimit} 次` : '每日不限次数';
  const url = `${origin}${pathname}#/qishui/link-parse?cardSecret=${secret}`;

  return `欢迎使用汽水音乐下载系统
    您的卡密：${secret}
    卡密类型为：${CARD_SECRET_TYPE_TEXT_MAP[type]}
    ${isCount ? `按次付费，总次数 ${parseLimitText}` : `过期时间：${expireTimeText}，${dailyLimitText}`}
    请使用以下链接前往浏览器访问：
      ${url}
    `;
};

/**
 * 预览并复制卡密发货文本
 * @example
 * ```ts
 * await copyCardSecretText(record);
 * ```
 */
export const copyCardSecretText = async (record: CardSecretListItem) => {
  const text = buildCardSecretShipText(record);
  copy(text);
  confirm(<div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>, '提示');
};
