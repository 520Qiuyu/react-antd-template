import type { AuthInfoListItem } from '@/types/authInfo';

/**
 * 判断认证信息是否完整
 * @example
 * ```ts
 * isAuthInfoComplete(item) // true
 * ```
 */
export const isAuthInfoComplete = (
  item: Pick<AuthInfoListItem, 'deviceId' | 'cookie' | 'xHelios' | 'xMedusa'>,
) => !!(item.deviceId?.trim() && item.cookie?.trim() && item.xHelios?.trim() && item.xMedusa?.trim());
