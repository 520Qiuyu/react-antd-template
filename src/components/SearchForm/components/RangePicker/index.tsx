import React from 'react';
import { DatePicker } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs, { Dayjs } from 'dayjs';
import classNames from 'classnames';
import styles from './index.module.less';

const { RangePicker: AntRangePicker } = DatePicker;

const RangePicker: React.FC<RangePickerCustomProps> = ({
  value,
  onChange,
  format = 'YYYY-MM-DD',
  className,
  placeholder = ['开始日期', '结束日期'],
  ...rest
}) => {
  // 将任意值转换为dayjs对象
  const toDayjs = (val: string | null | undefined): Dayjs | null => {
    if (!val) return null;
    if (dayjs.isDayjs(val)) return val as Dayjs;
    return dayjs(val);
  };

  // 处理范围值
  const rangeValue: [Dayjs | null, Dayjs | null] | null = Array.isArray(value)
    ? [toDayjs(value[0]), toDayjs(value[1])]
    : null;

  // 处理onChange
  const handleChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ): void => {
    console.log('dates', dates);
    console.log('dateStrings', dateStrings);
    if (dates && onChange) {
      onChange(
        dates.map((date) => (date ? dayjs(date).format(format) : '')) as string[],
        dateStrings,
      );
    }
  };

  return (
    <AntRangePicker
      value={rangeValue}
      onChange={handleChange}
      format={format}
      className={classNames(styles['rangePicker'], className)}
      placeholder={placeholder}
      {...rest}
    />
  );
};

export default RangePicker;

export interface RangePickerCustomProps extends Omit<RangePickerProps, 'value' | 'onChange'> {
  value?: string[];
  onChange?: (dates: string[], dateStrings: string[]) => void;
  format?: string;
  className?: string;
  placeholder?: [string, string];
}
