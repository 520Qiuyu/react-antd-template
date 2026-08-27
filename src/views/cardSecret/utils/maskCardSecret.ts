/**
 * 卡密中间脱敏：隐藏末段前 4 位，保留前缀与末尾，复制仍用原文
 * @example
 * maskCardSecretMiddle('QS-20260803-C2A33CD8') // 'QS-20260803-****3CD8'
 */
export const maskCardSecretMiddle = (secret: string) => {
  const text = secret.trim();
  if (!text) return '';

  const idx = text.lastIndexOf('-');
  if (idx === -1) {
    if (text.length <= 8) return `${text.slice(0, 2)}****${text.slice(-2)}`;
    return `${text.slice(0, -8)}****${text.slice(-4)}`;
  }

  const prefix = text.slice(0, idx + 1);
  const tail = text.slice(idx + 1);
  if (tail.length <= 4) return `${prefix}${'*'.repeat(tail.length)}`;
  return `${prefix}${'*'.repeat(4)}${tail.slice(4)}`;
};
