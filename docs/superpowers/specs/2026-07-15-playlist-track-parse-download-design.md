# 歌单曲目解析与批量下载设计

日期：2026-07-15  
范围：`react-antd-template` 汽水歌单解析页（`PlaylistResult` / `PlaylistParseView`）

## 背景

歌单分享链接解析后，列表仅展示基础曲目信息。用户需要：

1. 在歌单层批量解析 / 下载音频 / 下载歌词
2. 在单曲层解析后展示下载与歌词保存
3. 解析成功的曲目持久保存 `fullInfo`，并用视觉状态区分

## 目标

- 歌单层四个操作：全部解析、全部下载、下载全部 lrc、下载全部 txt
- 单曲层：未解析显示「解析」；已解析显示下载 / 下载 lrc / 下载 txt，行背景变为「已解析色」
- 「全部下载」及批量歌词：先补齐未解析曲目，再执行下载
- 音质选取：按从高到低的常量阶梯优先匹配，缺失则降一级

## 非目标

- 不改造歌曲解析页（`SongParseView`）的批量能力
- 不新增后端批量接口（继续逐首调用 `get-song-info`）
- 不做音质手动选择弹窗
- 不改试听-only 曲目的特殊业务规则（仍可尝试解析；若无可用 url 则跳过并提示）

## 数据模型

在 `PlaylistMusicInfo` 上增加可选字段：

```ts
fullInfo?: MusicInfo | null;
```

- 来源：`reqGetSongInfo({ songId: track.id })` → `res.data.fullInfo`
- 写入位置：更新 store 中的 `playlistHasResult.tracks[i].fullInfo`
- 「已解析」判定：`Boolean(track.fullInfo?.trackId || track.fullInfo?.urls?.length)`

状态仍挂在现有 `useLinkParseStore.playlistHasResult`（`PlaylistInfo | null`），避免另起 map。

## 音质常量

放在 `linkParse/constants.ts`（或 `utils`）：

```ts
/** 下载音质优先阶梯：从高到低，缺失则降一级 */
export const DOWNLOAD_QUALITY_ORDER = [
  'spatial',
  'hi_res',
  'highest',
  'higher',
  'medium',
  'lossless',
  'hq',
  'standard',
] as const;
```

`pickDownloadUrl(urls)`：按上述顺序找第一条有 `url` 的项；若都不命中，回退到 `urls.find(u => u.url)`。

同步扩展 `qualityLabel` 对新枚举的中文映射。

## UI 结构

### 歌单层工具栏

放在 `PlaylistHero` 下方、曲目列表工具栏上方（或与筛选行同一区域左侧/上方独立一行），对齐示意：

| 按钮 | 样式 | 行为 |
|------|------|------|
| 全部解析 | Primary（实心蓝） | 对未解析曲目逐首/小并发调用 `get-song-info`，写回 `fullInfo` |
| 全部下载 | Ghost | 先执行「补齐解析」，再对每首 `pickDownloadUrl` 后走现有解密下载流程 |
| 下载全部 lrc | Ghost | 先补齐解析，再对有 `lrc` 的曲目保存 `.lrc` |
| 下载全部 txt | Ghost | 先补齐解析，再对有 `lrcText`（无则从 lrc 粗剥时间轴，若已有字段则直接用）的曲目保存 `.txt` |

批量进行中：对应按钮 loading / 全局 disable，避免重复点击；可用 toast 汇总成功/失败数。

### 单曲列表行

- **未解析**：保留时长等；操作区为「解析」按钮（替换或并列原 `ExportOutlined` 占位）
- **解析中**：行内 loading，禁用该行操作
- **已解析**：
  - 行背景：浅薄荷绿 / 汽水青 tint（例如 `rgba(var(--lp-soda-rgb), 0.12)` + 左边框强调），与未解析白底区分
  - 操作：「下载」「下载 lrc」「下载 txt」

## 核心流程

### 单曲解析

1. 校验 `track.id`
2. `reqGetSongInfo({ songId })`
3. 成功则 `setPlaylistHasResult` 更新该 track 的 `fullInfo`
4. 失败：`msgError`，不改变已有 `fullInfo`

### 全部解析

1. 过滤 `!isParsed(track) && track.id`
2. 顺序或限制并发（建议并发 2～3，避免打爆接口）逐个解析
3. 结束提示「已解析 x / 失败 y」

### 全部下载 / 批量歌词

1. 先跑「补齐解析」（与全部解析同一路径）
2. 仅对当时已有有效 `fullInfo` 的曲目执行下载
3. 音频下载复用 `SongResult` 中的逻辑：进度拉取 → `playAuth` 解密 → 可选 `embedMetadata` → `downloadBlob`
4. 建议将单曲下载抽成共享函数（如 `downloadSongAudio(musicInfo, urlItem)`），歌单与音质列表共用，避免复制粘贴

### 错误与边界

| 场景 | 处理 |
|------|------|
| 无 `track.id` | 跳过，计入失败 |
| 接口非 200 / 无 fullInfo | 该首失败，继续后续 |
| 无匹配音质 / 无 url | 跳过该首下载并提示 |
| 无歌词 | 跳过该首歌词下载 |
| 用户清空歌单 / 重新解析链接 | `playlistHasResult` 整体替换，旧 `fullInfo` 自然丢弃 |

## 文件改动预期

| 文件 | 改动 |
|------|------|
| `src/types/qishui.ts` | `PlaylistMusicInfo.fullInfo` |
| `src/views/qishui/linkParse/constants.ts` | `DOWNLOAD_QUALITY_ORDER` |
| `src/views/qishui/linkParse/utils.ts` | `pickDownloadUrl`、`qualityLabel` 扩展 |
| `src/views/qishui/linkParse/components/PlaylistResult/*` | 批量按钮、行状态、解析/下载交互与样式 |
| 新建或抽取 `downloadSong.ts` / 扩展 utils | 复用音频与歌词下载 |

## 成功标准

- 点「全部解析」后，成功曲目行变色且出现三个下载按钮
- 点「全部下载」会先补解析再按最高可用音质保存文件
- 单曲「解析」与批量行为一致写回 `fullInfo`
- 歌词批量分别产出 `.lrc` / `.txt`
- 失败不中断整批，并有汇总提示
