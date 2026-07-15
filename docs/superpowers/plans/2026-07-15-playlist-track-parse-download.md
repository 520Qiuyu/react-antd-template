# Playlist Track Parse & Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 歌单列表支持单曲/批量解析，解析后挂载 `fullInfo`，并按音质阶梯下载音频与歌词。

**Architecture:** `PlaylistMusicInfo.fullInfo` 挂在 store 的 `playlistHasResult` 上；共享 `pickDownloadUrl` + `downloadSongAudio` / `downloadSongLyric`；`PlaylistResult` 负责 UI 与批量编排（并发 2）。

**Tech Stack:** React、Zustand、现有 `reqGetSongInfo`、`SodaAudioDecryptor`、`useEmbedAudioMetadata`、`downloadBlob`

## Global Constraints

- 音质阶梯：`spatial` → `hi_res` → `highest` → `higher` → `medium` → `lossless` → `hq` → `standard`
- 全部下载 / 批量歌词：先补齐解析再下载
- 不改造 `SongParseView`；不新加后端批量接口
- 不主动 git commit（除非用户要求）

---

### Task 1: 类型与音质工具

**Files:**
- Modify: `src/types/qishui.ts`
- Modify: `src/views/qishui/linkParse/constants.ts`
- Modify: `src/views/qishui/linkParse/utils.ts`

- [ ] **Step 1:** `PlaylistMusicInfo` 增加 `fullInfo?: MusicInfo | null`
- [ ] **Step 2:** 导出 `DOWNLOAD_QUALITY_ORDER`
- [ ] **Step 3:** 实现 `isTrackParsed`、`pickDownloadUrl`；扩展 `qualityLabel`

---

### Task 2: 共享下载工具

**Files:**
- Create: `src/views/qishui/linkParse/downloadSong.ts`
- Modify: `src/views/qishui/linkParse/components/SongResult/index.tsx`（可选：改用共享函数）

- [ ] **Step 1:** 导出 `buildSongFilename`、`buildLyricFilename`、`downloadSongAudio`、`downloadSongLyric`、`lrcToPlainText`
- [ ] **Step 2:** `downloadSongAudio` 接受 `MusicInfo` + `QishuiUrl` + 可选 `embedMetadata` / `onProgress`

---

### Task 3: PlaylistResult UI 与逻辑

**Files:**
- Modify: `src/views/qishui/linkParse/components/PlaylistResult/index.tsx`
- Modify: `src/views/qishui/linkParse/components/PlaylistResult/index.module.less`

- [ ] **Step 1:** 歌单层四按钮 + 批量状态
- [ ] **Step 2:** 单曲解析 / 已解析操作与解析色
- [ ] **Step 3:** 通过 store 更新 `tracks[].fullInfo`

---

### Task 4: 手工验收

- [ ] 解析单曲 → 行变色 + 三按钮
- [ ] 全部解析汇总
- [ ] 全部下载会先补解析
- [ ] lrc/txt 批量下载
