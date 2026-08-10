# SearchForm RangeInput Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SearchForm 补齐 `rangeInput` 数字范围输入组件，表单值为 `[min, max]`，失焦时自动纠正 `min > max`。

**Architecture:** 参照现有 `RangePicker`，新建受控组件 `RangeInput`（双 `InputNumber` + `~`），通过 `config.ts` 注册到 `COMPONENT_TYPE_MAP`，由 `SearchFormItem` 自动渲染。

**Tech Stack:** React、TypeScript、antd `InputNumber`、CSS Modules (less)

## Global Constraints

- 表单值格式：`[min, max]`，单项为 `number | null`
- 失焦纠正：改左框则 `min = max`，改右框则 `max = min`
- 半开区间允许（仅一侧有值）
- 两端皆空时 `onChange(null)`
- 不擅自提交 git（除非用户明确要求）
- 中文响应；事件函数使用 `handleXxx` 命名

---

### Task 1: RangeInput 组件

**Files:**
- Create: `frontend/src/components/SearchForm/components/RangeInput/index.tsx`
- Create: `frontend/src/components/SearchForm/components/RangeInput/index.module.less`
- Modify: `frontend/src/components/SearchForm/config.ts`
- Modify: `frontend/src/components/SearchForm/README.md`

**Interfaces:**
- Consumes: antd `InputNumber`、`InputNumberProps`
- Produces: `RangeInput` 默认导出；`RangeInputProps`（`value?: [number | null, number | null] | null`；`onChange?: (value: [number | null, number | null] | null) => void`）

- [ ] **Step 1: 实现 RangeInput 组件与样式**

创建逻辑要点：
- 本地记录最近编辑侧 `lastEdited: 'min' | 'max'`
- `handleMinChange` / `handleMaxChange` 即时 onChange
- `handleBlur` 做纠正
- 两端空 → `onChange(null)`

样式：外层 flex，默认宽 200px，两框 `flex: 1`，中间 `~`。

- [ ] **Step 2: 接入 config.ts**

导入 `RangeInput`，补齐 `COMPONENT_TYPE_MAP`、`COMPONENT_TYPE_PROPS_MAP`、`defaultComponentProps`。

- [ ] **Step 3: 更新 README**

补充 `rangeInput` 类型与 props 说明。

- [ ] **Step 4: 静态检查**

确认 `config.ts` 无未定义引用；组件可被 TypeScript 正确解析。
