import type { CardSecretListItem } from '@/types/cardSecret';
import copy from '@/utils/copy';
import { confirm } from '@/utils/modal';
import { applyCopyTemplate, getStoredCopyTemplate } from './copyTemplate';

/**
 * 构建卡密发货文本（按本地复制模板渲染）
 * @example
 * ```ts
 * const text = buildCardSecretShipText(record);
 * ```
 */
export const buildCardSecretShipText = (record: CardSecretListItem) => {
  return applyCopyTemplate(getStoredCopyTemplate(), record);
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
