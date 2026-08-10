import { Input, Select, type InputProps, type SelectProps } from 'antd';
import SelectSearch, { type SelectSearchProps } from '../SelectSearch';
import RangeInput, { type RangeInputProps } from './components/RangeInput';
import RangePicker, { type RangePickerCustomProps } from './components/RangePicker';

export const filterOption = (inputValue: string, option: any) => {
  return option.label.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
};
/** 类型组件映射 */
export const COMPONENT_TYPE_MAP = {
  input: Input,
  select: Select,
  selectSearch: SelectSearch,
  rangePicker: RangePicker,
  rangeInput: RangeInput,
};
/** 类型组件props映射 */
export interface COMPONENT_TYPE_PROPS_MAP {
  input: InputProps;
  select: SelectProps;
  selectSearch: SelectSearchProps;
  rangePicker: RangePickerCustomProps;
  rangeInput: RangeInputProps;
}
/** 默认组件类型 */
export const defaultComponent = 'input';
/** 默认组件属性 */
export const defaultComponentProps = {
  input: {
    placeholder: '请输入',
    style: { width: '200px' },
    allowClear: true,
  } as InputProps,
  select: {
    placeholder: '请选择',
    style: { width: '200px' },
    allowClear: true,
    mode: 'multiple',
    maxTagCount: 2,
    showSearch: true,
    filterOption,
  } as SelectProps,
  selectSearch: {} as SelectSearchProps,
  rangePicker: {} as RangePickerCustomProps,
  rangeInput: {
    placeholder: ['最小值', '最大值'],
    style: { width: '200px' },
  } as RangeInputProps,
};
export type COMPONENT_TYPE = keyof typeof COMPONENT_TYPE_MAP;
