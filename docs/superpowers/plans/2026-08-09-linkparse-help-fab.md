# LinkParse HelpFab Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** 在 linkParse 页右下角增加可展开的使用教程帮助入口。

**Architecture:** 独立 `HelpFab` 组件管理展开态与 localStorage 首次提示；URL 常量放在 `constants.ts`；页面根节点挂载。

**Tech Stack:** React、Less modules、Ant Design Icons、localStorage

## Global Constraints

- 中文文案；事件 handler 用 `handleXxx`
- 样式复用页面 CSS 变量（`--lp-*`）
- 不擅自删除现有注释

---

### Task 1: 常量 + HelpFab 组件

- [ ] 在 `constants.ts` 增加 `HELP_DOC_URL`
- [ ] 新建 `components/HelpFab/index.tsx` + `index.module.less`
- [ ] 实现 FAB / 面板 / 首次自动展开 / Escape / 点击外部 / reduced-motion

### Task 2: 页面挂载

- [ ] 在 `linkParse/index.tsx` 挂载 `<HelpFab />`
- [ ] 本地目测：桌面与窄屏位置、首次/二次访问行为
