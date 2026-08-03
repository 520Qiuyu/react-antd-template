# 卡密复制模板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 支持用户自定义卡密发货复制文本模板，经弹窗编辑并以 localStorage 持久化。

**Architecture:** 抽出 `copyTemplate.ts` 统一占位符与渲染；`CopyTemplateModal` 负责编辑/插入/预览/保存；`copyCardSecretText` 读取模板渲染后复制。

**Tech Stack:** React、Ant Design、ahooks `useLocalStorageState`、项目 `MyModal` / `useVisible`

## Global Constraints

- localStorage key：`qishuiCardSecretCopyTemplate`
- 占位符：`【卡号】【访问链接】【类型】【套餐】【过期时间】【总次数】【每日上限】【备注】`
- 与导出模板 key 独立，不混用
- 中文 UI；事件命名 `handleXxx`

---

### Task 1: copyTemplate 工具

**Files:**
- Create: `frontend/src/views/qishui/cardSecret/utils/copyTemplate.ts`
- Modify: `frontend/src/views/qishui/cardSecret/utils/copyCardSecretText.tsx`

**Interfaces:**
- Produces: `COPY_TEMPLATE_STORAGE_KEY`, `DEFAULT_COPY_TEMPLATE`, `COPY_TEMPLATE_PLACEHOLDERS`, `buildCardSecretParseUrl`, `buildPackageText`, `applyCopyTemplate`, `getStoredCopyTemplate`

- [x] **Step 1: 实现 copyTemplate.ts**

导出常量与函数：占位符 map、默认模板、套餐文案、`applyCopyTemplate(template, record)`、`getStoredCopyTemplate()`（读 localStorage，空则默认）。

- [x] **Step 2: 改造 copyCardSecretText.tsx**

用 `getStoredCopyTemplate` + `applyCopyTemplate` 替换硬编码 `buildCardSecretShipText`；删除或改写为薄封装。

---

### Task 2: CopyTemplateModal

**Files:**
- Create: `frontend/src/views/qishui/cardSecret/components/CopyTemplateModal/index.tsx`
- Create: `frontend/src/views/qishui/cardSecret/components/CopyTemplateModal/index.module.less`

**Interfaces:**
- Consumes: Task 1 全部导出
- Produces: `forwardRef` 弹窗，`open()` 无参

- [x] **Step 1: 实现弹窗**

TextArea + 可点 Tag 插入光标 + 示例预览 + 恢复默认 / 取消 / 保存（`useLocalStorageState`）。

- [x] **Step 2: 样式**

参考 ExportModal：说明条、标签区、预览等宽字体浅底。

---

### Task 3: 接入卡密列表页

**Files:**
- Modify: `frontend/src/views/qishui/cardSecret/index.tsx`

- [x] **Step 1: 接入**

补 `SettingOutlined`、`CopyTemplateModal` ref、`handleSetCopyTemplate`、渲染弹窗。

- [ ] **Step 2: 手动验收**

打开弹窗 → 插入占位符 → 预览变化 → 保存 → 复制发货文本符合模板；刷新后仍生效；快速创建页同步。
