import type { MutableRefObject } from 'react';

type NativeInputElement = HTMLInputElement | HTMLTextAreaElement;

interface AntdInputLikeRef {
  input?: HTMLInputElement | null;
  resizableTextArea?: {
    textArea?: HTMLTextAreaElement | null;
  } | null;
}

type InsertTextAtCursorRef = NativeInputElement | AntdInputLikeRef;

type UseInsertTextAtCursorReturn<T extends InsertTextAtCursorRef> = [
  MutableRefObject<T | null>,
  (text: string) => void,
];

/**
 * 在输入框当前光标位置插入文本，并派发原生 input/change 事件。
 *
 * @example
 * ```tsx
 * const [inputRef, insertTextAtCursor] = useInsertTextAtCursor();
 *
 * <Input.TextArea ref={inputRef} />
 * <Button onClick={() => insertTextAtCursor('【学生姓名】')}>插入字段</Button>
 * ```
 */
export const useInsertTextAtCursor = <
  T extends InsertTextAtCursorRef = AntdInputLikeRef,
>(): UseInsertTextAtCursorReturn<T> => {
  const inputRef = useRef<T | null>(null);

  /** 获取真实的 input 或 textarea 元素 */
  const getInputElement = () => {
    const inputInstance = inputRef.current;

    if (!inputInstance) return null;
    if (inputInstance instanceof HTMLInputElement) return inputInstance;
    if (inputInstance instanceof HTMLTextAreaElement) return inputInstance;

    return inputInstance.resizableTextArea?.textArea || inputInstance.input || null;
  };

  /** 通过原生 setter 更新值，确保受控组件可以正确响应变更 */
  const setNativeValue = (element: NativeInputElement, value: string) => {
    const prototype =
      element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    valueSetter?.call(element, value);
  };

  /** 在当前光标位置插入指定文本 */
  const insertTextAtCursor = (text: string) => {
    const inputElement = getInputElement();

    if (!inputElement) return;

    const currentValue = inputElement.value || '';
    const selectionStart = inputElement.selectionStart ?? currentValue.length;
    const selectionEnd = inputElement.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, selectionStart)}${text}${currentValue.slice(
      selectionEnd,
    )}`;
    const nextCursorPosition = selectionStart + text.length;

    setNativeValue(inputElement, nextValue);
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  return [inputRef, insertTextAtCursor];
};
