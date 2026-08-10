import React, { useState } from 'react';
import { InputNumber, type InputNumberProps } from 'antd';
import classNames from 'classnames';
import styles from './index.module.less';

type RangeValue = [number | null, number | null];

/**
 * 数字范围输入组件（双 InputNumber），用于 SearchForm 的 rangeInput 类型
 *
 * @example
 * ```tsx
 * <RangeInput
 *   value={[10, 100]}
 *   onChange={(val) => console.log(val)}
 *   placeholder={['最低价', '最高价']}
 * />
 * ```
 */
const RangeInput: React.FC<RangeInputProps> = ({
  value,
  onChange,
  placeholder = ['最小值', '最大值'],
  className,
  style,
  ...rest
}) => {
  const [lastEdited, setLastEdited] = useState<'min' | 'max'>('min');

  const min = Array.isArray(value) ? value[0] : null;
  const max = Array.isArray(value) ? value[1] : null;

  /**
   * 向外抛出范围值；两端皆空时抛出 null
   */
  const emitChange = (nextMin: number | null, nextMax: number | null) => {
    if (!onChange) return;
    if (nextMin === null && nextMax === null) {
      onChange(null);
      return;
    }
    onChange([nextMin, nextMax]);
  };

  const handleMinChange = (val: number | string | null) => {
    setLastEdited('min');
    const nextMin = typeof val === 'number' ? val : null;
    emitChange(nextMin, max);
  };

  const handleMaxChange = (val: number | string | null) => {
    setLastEdited('max');
    const nextMax = typeof val === 'number' ? val : null;
    emitChange(min, nextMax);
  };

  const handleBlur = () => {
    if (min === null || max === null) return;
    if (min <= max) return;
    if (lastEdited === 'min') {
      emitChange(max, max);
      return;
    }
    emitChange(min, min);
  };

  return (
    <div className={classNames(styles['rangeInput'], className)} style={style}>
      <InputNumber
        {...rest}
        value={min}
        onChange={handleMinChange}
        onBlur={handleBlur}
        placeholder={placeholder[0]}
      />
      <span className={styles['separator']}>~</span>
      <InputNumber
        {...rest}
        value={max}
        onChange={handleMaxChange}
        onBlur={handleBlur}
        placeholder={placeholder[1]}
      />
    </div>
  );
};

export default RangeInput;

export interface RangeInputProps extends Omit<InputNumberProps, 'value' | 'onChange' | 'placeholder'> {
  value?: RangeValue | null;
  onChange?: (value: RangeValue | null) => void;
  placeholder?: [string, string];
  className?: string;
}
