/**
 * 复制文本到剪贴板
 *
 * @description 优先 Clipboard API（需安全上下文）；否则同步降级到 execCommand
 * @example
 * // 复制普通文本
 * await copy('Hello World');
 *
 * // 复制 HTML
 * await copy('<b>Hello World</b>', { html: true });
 */

interface CopyOptions {
  /** 是否复制为 HTML 内容 */
  html?: boolean;
}

/**
 * 非安全上下文 / Clipboard API 不可用时的降级复制
 * @description 必须在用户手势的同步调用栈内执行；textarea 放在视口内透明，避免 iOS/部分 Chromium 选区无效
 * @example
 * ```ts
 * fallbackCopyText('hello');
 * ```
 */
const fallbackCopyText = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // iOS 需要可读选区：放在视口内、透明，不可用 top:-9999 完全移出视口
  textArea.setAttribute('readonly', '');
  textArea.setAttribute('aria-hidden', 'true');
  textArea.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:1px',
    'height:1px',
    'padding:0',
    'margin:0',
    'border:0',
    'outline:none',
    'box-shadow:none',
    'background:transparent',
    'opacity:0',
    // 'z-index:-1',
  ].join(';');
  const active = (document.activeElement as HTMLElement) || document.body;
  active.appendChild(textArea);

  try {
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const ok = document.execCommand('copy');
    if (!ok) {
      throw new Error('复制失败，请检查浏览器权限设置');
    }
  } finally {
    active.removeChild(textArea);
  }
};

/**
 * 复制文本到剪贴板
 * @example
 * ```ts
 * await copy('卡密内容');
 * ```
 */
export const copy = async (text: string, options: CopyOptions = {}): Promise<void> => {
  const content = text ?? '';
  debugger;

  // 安全上下文才走 Clipboard API；失败后再降级（保留用户手势内的同步降级）
  if (navigator.clipboard && window.isSecureContext) {
    try {
      if (options.html) {
        const type = 'text/html';
        const blob = new Blob([content], { type });
        await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      } else {
        await navigator.clipboard.writeText(content);
      }
      return;
    } catch {
      // Clipboard API 失败时继续走降级（可能已离开用户手势，仍尽量尝试）
    }
  }

  try {
    fallbackCopyText(content);
  } catch (err) {
    console.log('error', err);
    throw new Error(err instanceof Error ? err.message : '复制失败，请重试');
  }
};

export default copy;
