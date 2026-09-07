import classNames from 'classnames';
import styles from './index.module.less';

export type ModeSegmentTheme = 'qishui' | 'netease';

/** 单个切换项 */
export interface ModeSegmentItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

/**
 * 键盘切换后是否需要恢复焦点。
 * 切换选中项通常伴随父级整页替换组件（ModeSegment 被卸载重建），
 * ref 会随实例销毁，因此用模块级标记跨实例传递。
 */
let pendingFocus = false;

/**
 * 目标是否为可编辑元素。输入框内 Ctrl + ←/→ 是「按词移动光标」，不能被抢占
 * @example
 * ```ts
 * isEditableTarget(event.target); // 焦点在 input 内 → true
 * ```
 */
const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element?.tagName) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
};

interface ModeSegmentProps<T extends string = string> {
  /** 切换项列表 */
  items: ModeSegmentItem<T>[];
  /** 当前选中值 */
  value: T;
  /** 选中项变化 */
  onChange: (value: T) => void;
  /** 配色主题：汽水绿 / 网易红 */
  theme?: ModeSegmentTheme;
  /** 无障碍标签 */
  ariaLabel?: string;
}

/**
 * 通用解析类型切换（同页 Tab）。
 * 全局快捷键 Ctrl + ←/→ 可随时切换（输入框内除外）；
 * 焦点落在某一项上时，另支持裸 ←/→ 逐项切换、Home/End 跳到首尾。
 * @example
 * ```tsx
 * <ModeSegment
 *   theme='netease'
 *   items={[{ value: 'song', label: '单曲', icon: <CustomerServiceOutlined /> }]}
 *   value={currentView}
 *   onChange={setCurrentView}
 * />
 * ```
 */
const ModeSegment = <T extends string>({
  items,
  value,
  onChange,
  theme = 'qishui',
  ariaLabel = '解析类型',
}: ModeSegmentProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);
  const currentIndex = items.findIndex((item) => item.value === value);

  // 键盘切换后焦点需跟随到新的选中项，否则无法连续按方向键
  useEffect(() => {
    if (!pendingFocus) return;
    pendingFocus = false;
    listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
  });

  // 全局快捷键：Ctrl + ←/→
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (isEditableTarget(event.target)) return;

      const index = items.findIndex((item) => item.value === value);
      if (index < 0) return;

      event.preventDefault();
      // 焦点原本就在切换器内时，让它跟随到新的选中项；否则不打扰用户当前焦点
      if (listRef.current?.contains(document.activeElement)) {
        pendingFocus = true;
      }
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = items[(index + offset + items.length) % items.length];
      if (next.value !== value) onChange(next.value);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [items, value, onChange]);

  const handleSelect = (next: T) => {
    if (next === value) return;
    onChange(next);
  };

  return (
    <div
      ref={listRef}
      className={styles['segment']}
      data-theme={theme}
      data-columns={items.length}
      role='tablist'
      aria-label={ariaLabel}
      title='Ctrl + ←/→ 切换'>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            className={classNames(styles['item'], { [styles['isActive']]: active })}
            type='button'
            role='tab'
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => handleSelect(item.value)}>
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSegment;
