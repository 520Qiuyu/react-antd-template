import type { AuthInfoListItem, AuthInfoPayload } from '@/types/authInfo';

/**
 * 规范化文本
 * @example
 * ```ts
 * normalizeText('  abc  ') // 'abc'
 * ```
 */
export const normalizeText = (value?: string) => value?.trim() || '';

/**
 * 把认证 JSON 格式化成可编辑文本
 * @example
 * ```ts
 * stringifyAuthInfoJson({ cookie: 'a=1' }, ['name']);
 * ```
 */
export const stringifyAuthInfoJson = (
  payload?: AuthInfoPayload | null,
  omitKeys: string[] = [],
) => {
  const source =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? { ...payload }
      : {};
  omitKeys.forEach((key) => {
    delete source[key];
  });
  return JSON.stringify(source, null, 2);
};

/**
 * 解析并校验认证 JSON 文本，仅接受对象
 * @example
 * ```ts
 * parseAuthInfoJson('{"name":"主号"}');
 * ```
 */
export const parseAuthInfoJson = (value?: string): AuthInfoPayload => {
  const text = normalizeText(value);
  if (!text) {
    throw new Error('请输入认证 JSON');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 格式不合法');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('认证信息需为 JSON 对象');
  }

  return parsed as AuthInfoPayload;
};

/**
 * 判断认证信息是否完整
 * @example
 * ```ts
 * isAuthInfoComplete(item) // true
 * ```
 */
export const isAuthInfoComplete = (item: Pick<AuthInfoListItem, 'complete' | 'isAvailable'>) =>
  item.complete || item.isAvailable;
