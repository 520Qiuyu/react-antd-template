# SearchForm RangeInput 设计

## 背景

`SearchForm` 的 `COMPONENT_TYPE_MAP` 已声明 `rangeInput`，但组件尚未实现。需要补齐数字范围输入能力，供搜索筛选使用。

## 目标

- 支持数字范围输入，表单值为 `[min, max]`
- 与现有 `rangePicker` 封装方式一致，可直接通过 `type: 'rangeInput'` 使用
- 失焦时若 `min > max` 自动纠正

## 非目标

- 不支持字符串范围
- 不拆成两个独立 Form 字段名
- 不做 Slider 联动
- 不在组件内做 Form 校验提示（纠正即可）

## 方案

新建 `frontend/src/components/SearchForm/components/RangeInput/`，双 `InputNumber` + 中间分隔符 `~`。

### API

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | `[number \| null, number \| null] \| null \| undefined` | - | 受控值 |
| onChange | `(value: [number \| null, number \| null] \| null) => void` | - | 值变化回调 |
| placeholder | `[string, string]` | `['最小值', '最大值']` | 左右占位 |
| className | string | - | 外层 class |
| 其余 | InputNumber 常用 props | - | 透传至两侧（如 min/max/precision） |

### 行为

1. 输入过程中即时 `onChange([min, max])`
2. 失焦时：两端均有值且 `min > max` 则纠正
   - 改左框：`min = max`
   - 改右框：`max = min`
3. 仅一端有值或两端为空：不纠正
4. 清空任一侧：对应位置为 `null`，另一侧保留
5. 两端都为空时，`onChange(null)`（便于 Form 清空）

### 样式

- 整体默认宽度约 `200px`（可被覆盖）
- 两框均分，中间 `~` 固定间距
- 使用 `index.module.less`，类名风格对齐现有 SearchForm 组件

### config 接入

- `COMPONENT_TYPE_MAP.rangeInput = RangeInput`
- `COMPONENT_TYPE_PROPS_MAP` 增加 `rangeInput: RangeInputProps`
- `defaultComponentProps.rangeInput` 补充默认 placeholder / 宽度
- README 补充 `rangeInput` 类型说明

### 用法示例

```tsx
{
  name: 'price',
  label: '价格',
  type: 'rangeInput',
  inputProps: {
    placeholder: ['最低价', '最高价'],
    precision: 0,
  },
}
```

查询结果：`{ price: [10, 100] }`

## 文件变更

| 文件 | 变更 |
| --- | --- |
| `components/SearchForm/components/RangeInput/index.tsx` | 新增 |
| `components/SearchForm/components/RangeInput/index.module.less` | 新增 |
| `components/SearchForm/config.ts` | 导入并补齐类型与默认 props |
| `components/SearchForm/README.md` | 补充 rangeInput 文档 |

## 验收

- `type: 'rangeInput'` 可渲染双数字输入框
- Form 能正确读写 `[min, max]`
- `min > max` 失焦后自动纠正
- 半开区间（只填一侧）可正常提交
