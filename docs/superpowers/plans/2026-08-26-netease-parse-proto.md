# 网易云解析静态原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `frontend/proto/netease.html` 交付网易云红主题的单文件解析原型（歌曲 / 歌单，Segment 切换）。

**Architecture:** 克隆汽水 `frontend/proto/index.html` 的文档站骨架与组件配方，色相换成 `--lp-*` 网易云红 token。单文档壳 + 输入区 Segment 切模式；mock 数据本地渲染，不接接口。

**Tech Stack:** 单文件 HTML / CSS / JS；Remix Icon；Plus Jakarta Sans + Noto Sans SC。

## Global Constraints

- 交付物仅 `frontend/proto/netease.html`；不改 React 页、不改路由、不改汽水 `index.html`
- Token 前缀 `--lp-*`，禁止子块硬编码品牌色（`#fff` 与语义成功绿除外）
- 模式切换只在 Segment；顶栏 / 左侧不做歌曲·歌单导航
- 不做卡密、播放器、下载引擎、HelpFab、真实接口
- 断点仅 `1200 / 960 / 560`；必须写 `prefers-reduced-motion`
- 不自动 git commit

---

### Task 1: 单文件原型

**Files:**
- Create: `frontend/proto/netease.html`

**Interfaces:**
- Consumes: spec `frontend/docs/superpowers/specs/2026-08-26-netease-parse-proto-design.md`；视觉对照 `frontend/proto/index.html`
- Produces: 可直接用浏览器打开的静态页；`#song` / `#playlist` 恢复模式

- [x] **Step 1: 写完整 `netease.html`**

  必须包含：`:root` 红金 token 与三层径向背景；56px 玻璃顶栏（红音符 Logo + 网易云解析 Docs + 外链）；左侧仅「参考」；中间单文档；输入区 `role="tablist"` Segment；歌曲 / 歌单 mock 结果；空 / 错 / loading；复制反馈；歌单筛选；TOC 随模式与结果重建；侧栏抽屉；三档响应式；reduced-motion。

- [x] **Step 2: 浏览器走查**

  打开 `frontend/proto/netease.html`，确认：默认歌曲模式与示例链接；切歌单后标题 / hint / 输入 / 空状态重置；空提交报错；解析出歌曲卡 / 音质 / 歌词；解析出歌单 Hero + 筛选；复制 ID 反馈；`≤1200` 无 TOC；`≤960` 汉堡开侧栏。
