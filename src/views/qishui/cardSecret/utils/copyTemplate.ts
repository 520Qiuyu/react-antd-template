import type { CardSecretListItem } from '@/types/cardSecret';
import dayjs from 'dayjs';
import { CARD_SECRET_TYPE_TEXT_MAP } from '../constants';
import { getValidDaysExpireAt } from './cardSecretTime';

/** 卡密发货复制模板 localStorage key */
export const COPY_TEMPLATE_STORAGE_KEY = 'qishuiCardSecretCopyTemplate';

/** 默认发货复制模板（与历史硬编码文案语义一致） */
export const DEFAULT_COPY_TEMPLATE = `欢迎使用汽水音乐下载系统
您的卡密：【卡号】
卡密类型为：【类型】
【套餐】
请使用以下链接前往浏览器访问：
  【访问链接】
`;

/**
 * 构建卡密解析访问链接
 * @example
 * ```ts
 * const url = buildCardSecretParseUrl('abc123');
 * ```
 */
export const buildCardSecretParseUrl = (secret: string) => {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/qishui/link-parse?cardSecret=${secret}`;
};

/**
 * 构建【套餐】组合描述
 * @example
 * ```ts
 * buildPackageText(record); // '按次付费，总次数 10次'
 * ```
 */
export const buildPackageText = (record: CardSecretListItem) => {
  const { type, expireTime, enableTime, validDays, parseLimit, dailyParseLimit } = record;
  const isCount = type === 'count';
  const hasConfiguredValidDays = validDays != null && validDays > 0;
  const expireAt = hasConfiguredValidDays
    ? getValidDaysExpireAt(enableTime, validDays)
    : dayjs(expireTime);
  const expireTimeText = expireAt ? expireAt.format('YYYY-MM-DD HH:mm:ss') : '等待更新';
  const parseLimitText = parseLimit ? `${parseLimit}次` : '-';
  const dailyLimitText =
    dailyParseLimit != null && dailyParseLimit > 0
      ? `每日上限 ${dailyParseLimit} 次`
      : '每日不限次数';

  if (isCount) {
    return `按次付费，总次数 ${parseLimitText}`;
  }
  const validDaysText = hasConfiguredValidDays
    ? `有效期 ${validDays} 天${enableTime ? '' : '（首次使用后起算）'}`
    : null;
  return [`过期时间：${expireTimeText}`, validDaysText, dailyLimitText].filter(Boolean).join('，');
};

type PlaceholderResolver = (record: CardSecretListItem) => string;

/** 复制模板占位符定义（label 用于弹窗展示） */
export const COPY_TEMPLATE_PLACEHOLDERS: {
  key: string;
  label: string;
  resolve: PlaceholderResolver;
}[] = [
  {
    key: '【卡号】',
    label: '卡号',
    resolve: (record) => record.secret ?? '',
  },
  {
    key: '【访问链接】',
    label: '访问链接',
    resolve: (record) => buildCardSecretParseUrl(record.secret),
  },
  {
    key: '【类型】',
    label: '类型',
    resolve: (record) => CARD_SECRET_TYPE_TEXT_MAP[record.type] ?? '',
  },
  {
    key: '【套餐】',
    label: '套餐',
    resolve: (record) => buildPackageText(record),
  },
  {
    key: '【过期时间】',
    label: '过期时间',
    resolve: (record) =>
      record.expireTime ? dayjs(record.expireTime).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    key: '【启用时间】',
    label: '启用时间',
    resolve: (record) =>
      record.enableTime ? dayjs(record.enableTime).format('YYYY-MM-DD HH:mm:ss') : '未启用',
  },
  {
    key: '【有效期】',
    label: '有效期',
    resolve: (record) => (record.validDays != null ? `${record.validDays}天` : '-'),
  },
  {
    key: '【总次数】',
    label: '总次数',
    resolve: (record) => (record.parseLimit != null ? String(record.parseLimit) : '-'),
  },
  {
    key: '【每日上限】',
    label: '每日上限',
    resolve: (record) =>
      record.dailyParseLimit != null && record.dailyParseLimit > 0
        ? String(record.dailyParseLimit)
        : '不限',
  },
  {
    key: '【备注】',
    label: '备注',
    resolve: (record) => record.remark ?? '',
  },
];

/**
 * 按模板替换占位符，生成发货文本
 * @example
 * ```ts
 * const text = applyCopyTemplate(DEFAULT_COPY_TEMPLATE, record);
 * ```
 */
export const applyCopyTemplate = (template: string, record: CardSecretListItem) => {
  return COPY_TEMPLATE_PLACEHOLDERS.reduce(
    (text, item) => text.replaceAll(item.key, item.resolve(record)),
    template,
  );
};

/**
 * 读取本地存储的复制模板，空值回退默认模板
 * @example
 * ```ts
 * const template = getStoredCopyTemplate();
 * ```
 */
export const getStoredCopyTemplate = () => {
  try {
    const raw = localStorage.getItem(COPY_TEMPLATE_STORAGE_KEY);
    if (raw == null || raw === '') {
      return DEFAULT_COPY_TEMPLATE;
    }
    // ahooks useLocalStorageState 会 JSON.stringify 字符串，多一层引号
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'string' && parsed.trim()) {
        return parsed;
      }
    } catch {
      // 非 JSON，按纯文本处理
    }
    return raw.trim() ? raw : DEFAULT_COPY_TEMPLATE;
  } catch {
    return DEFAULT_COPY_TEMPLATE;
  }
};
