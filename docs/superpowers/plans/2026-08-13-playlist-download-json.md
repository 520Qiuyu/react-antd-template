# 歌单批量解析并下载 JSON Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发环境下点击「下载JSON」时，先批量解析当前筛选曲目，再导出 `{ 歌单名, list }` JSON 文件。

**Architecture:** 业务编排放在 `PlaylistResult.handleDownloadAllJson`（`parseTracksBatch` → 读 store 最新曲目 → 映射字段 → `downloadAsJson`）；`TrackList` 只负责按钮 UI、`batchAction: 'downloadJson'` 与调用回调。与「下载全部歌词」模式一致。

**Tech Stack:** React、TypeScript、Zustand store、已有 `@/utils/download` 的 `downloadAsJson`

## Global Constraints

- 仅 `isDev` 显示「下载JSON」按钮
- 作用范围：当前筛选结果 `filteredTracks`，非强制重解析
- JSON 顶层键名固定为中文 `歌单名` + `list`
- `list` 每项字段：`id, title, artist, album, cover, duration, type, urls, lrc, lrcText`
- 复用 `parseTracksBatch` 以驱动 `liveSuccessCount` / `liveFailCount`
- 事件函数命名 `handleXxx`；中文响应
- 不擅自提交 git（除非用户明确要求）

**Spec:** `frontend/docs/superpowers/specs/2026-08-13-playlist-download-json-design.md`

## File Structure

| 文件 | 职责 |
| --- | --- |
| `frontend/src/views/qishui/linkParse/components/PlaylistResult/index.tsx` | 实现 `handleDownloadAllJson`，传入 TrackList |
| `frontend/src/views/qishui/linkParse/components/PlaylistResult/components/TrackList/index.tsx` | 按钮 handler、`BatchAction`、parse live UI |

---

### Task 1: PlaylistResult — handleDownloadAllJson

**Files:**
- Modify: `frontend/src/views/qishui/linkParse/components/PlaylistResult/index.tsx`

**Interfaces:**
- Consumes: `parseTracksBatch`、`usePlaylistParseStore.getState().playlistHasResult`、`downloadAsJson`、`msgSuccess` / `msgError`、`data.title`
- Produces: `handleDownloadAllJson(targetTracks: PlaylistMusicInfo[]) => Promise<void>`，传给 TrackList 的 `onDownloadAllJson`

- [x] **Step 1: 增加 import**

在文件顶部增加：

```ts
import { downloadAsJson } from '@/utils/download';
```

（`msgError` / `msgSuccess` 已存在。）

- [x] **Step 2: 实现映射与下载逻辑**

在 `handleDownloadAllLyrics` 之前（或附近）添加：

```ts
/**
 * 批量解析后导出歌单 JSON
 * @example
 * await handleDownloadAllJson(filteredTracks);
 */
const handleDownloadAllJson = async (targetTracks: PlaylistMusicInfo[]) => {
  if (targetTracks.length === 0) return;

  setBatchProgress({ success: 0, failed: 0 });
  try {
    const { success, failed, total } = await parseTracksBatch(targetTracks, false);

    const trackIdSet = new Set(targetTracks.map((track) => track.id).filter(Boolean));
    const latestById = new Map(
      (usePlaylistParseStore.getState().playlistHasResult?.tracks || [])
        .filter((track) => track.id && trackIdSet.has(track.id))
        .map((track) => [track.id!, track] as const),
    );

    const list = targetTracks.map((track) => {
      const latest = (track.id && latestById.get(track.id)) || track;
      const fullInfo = latest.fullInfo;
      return {
        id: latest.id,
        title: fullInfo?.title ?? latest.title,
        artist: fullInfo?.artist ?? latest.artist,
        album: fullInfo?.album ?? latest.album,
        cover: fullInfo?.cover ?? latest.cover,
        duration: latest.duration,
        type: latest.type,
        urls: fullInfo?.urls ?? [],
        lrc: fullInfo?.lrc ?? '',
        lrcText: fullInfo?.lrcText ?? '',
      };
    });

    const playlistTitle = data.title?.trim() || '歌单';
    const safeFilename = playlistTitle.replace(/[\\/:*?"<>|]/g, '_');

    downloadAsJson(
      {
        歌单名: playlistTitle,
        list,
      },
      safeFilename,
    );

    if (total === 0) {
      msgSuccess(`JSON 已导出：共 ${list.length} 首`);
    } else {
      msgSuccess(`JSON 已导出：解析成功 ${success}，失败 ${failed}`);
    }
  } catch (error) {
    console.log('handleDownloadAllJson error', error);
    msgError(error instanceof Error ? error.message : 'JSON 导出失败');
  }
};
```

注意：`parseTracksBatch` 已在组件内定义，直接闭包调用即可。

- [x] **Step 3: 传给 TrackList**

```tsx
<TrackList
  tracks={tracks}
  parsingIds={parsingIds}
  liveSuccessCount={batchProgress.success}
  liveFailCount={batchProgress.failed}
  onBatchParse={handleBatchParse}
  onBatchDownload={handleBatchDownload}
  onDownloadAllLyrics={handleDownloadAllLyrics}
  onDownloadAllJson={handleDownloadAllJson}
  onParse={parseTrack}
  onDownload={handleDownload}
  onDownloadLyric={handleDownloadLyric}
/>
```

- [x] **Step 4: 类型检查**

确认本文件对 `onDownloadAllJson` 的传参与 Task 2 的 props 一致；暂无编译错误以外的依赖。

---

### Task 2: TrackList — 按钮与 batchAction

**Files:**
- Modify: `frontend/src/views/qishui/linkParse/components/PlaylistResult/components/TrackList/index.tsx`

**Interfaces:**
- Consumes: `onDownloadAllJson: (tracks: PlaylistMusicInfo[]) => Promise<void>`（来自 Task 1）
- Produces: UI 可点击；`BatchAction` 含 `'downloadJson'`

- [x] **Step 1: 扩展 BatchAction 与 props**

`BatchAction` 联合类型增加 `'downloadJson'`：

```ts
export type BatchAction =
  | 'parse'
  | 'parseUnparsed'
  | 'download'
  | 'downloadUndownloaded'
  | 'downloadJson'
  | 'retry'
  | 'lrc'
  | 'txt'
  | null;
```

`TrackListProps` 增加：

```ts
/**
 * 批量解析后下载歌单 JSON
 * @example
 * onDownloadAllJson(filteredTracks);
 */
onDownloadAllJson: (tracks: PlaylistMusicInfo[]) => Promise<void>;
```

组件参数解构增加 `onDownloadAllJson`。

- [x] **Step 2: 实现 handleDownloadAllJson**

放在 `handleDownloadAllLyrics` 附近：

```ts
/** 全部解析后下载歌单 JSON */
const handleDownloadAllJson = async () => {
  if (batchAction) return;
  setBatchAction('downloadJson');
  try {
    await onDownloadAllJson(filteredTracks);
  } finally {
    setBatchAction(null);
  }
};
```

- [x] **Step 3: 修正按钮 loading / 实时计数**

将：

```ts
const isParseBatch = batchAction === 'parse' || batchAction === 'parseUnparsed';
```

改为：

```ts
const isParseBatch =
  batchAction === 'parse' ||
  batchAction === 'parseUnparsed' ||
  batchAction === 'downloadJson';
```

并增加：

```ts
const showDownloadJsonLive = batchAction === 'downloadJson';
```

「下载JSON」按钮改为（替换现有错误的 `batchAction === 'download'` / `showDownloadLive`）：

```tsx
{isDev ? (
  <button
    className={classNames(sharedStyles['btn'], sharedStyles['btnGhost'])}
    type='button'
    disabled={filteredTracks.length === 0 || batchBusy}
    onClick={handleDownloadAllJson}>
    {batchAction === 'downloadJson' ? <LoadingOutlined /> : <CloudDownloadOutlined />}
    下载JSON
    {showDownloadJsonLive ? (
      <>
        <span className={classNames(styles['btnCount'], styles['btnCountOk'])}>
          {liveSuccessCount}
        </span>
        <span className={classNames(styles['btnCount'], styles['btnCountFail'])}>
          {liveFailCount}
        </span>
      </>
    ) : (
      <span className={styles['btnCount']}>{filteredTracks.length}</span>
    )}
  </button>
) : null}
```

- [ ] **Step 4: 手动验证**（需在本地 dev 页面点验）

1. `pnpm`/`npm` 启动 frontend，打开歌单解析页（dev）。
2. 未解析歌单：点「下载JSON」→ 按钮出现 loading 与成功/失败计数 → 浏览器下载 `{歌单名}.json`，顶层含 `歌单名`、`list`，项含 `urls`/`lrc`（有数据时）。
3. 已全部解析：再次点击应较快完成，toast 为「共 n 首」。
4. 筛选子集：导出条数 = 筛选数，顺序一致。
5. 生产构建或非 DEV：按钮不出现。

---

## Spec Coverage Checklist

| Spec 要求 | Task |
| --- | --- |
| 批量解析未解析曲目 | Task 1 `parseTracksBatch(..., false)` |
| JSON 结构 `歌单名` + `list` | Task 1 |
| 字段含 id/元信息/封面/urls/歌词 | Task 1 映射 |
| 筛选范围 | Task 2 `filteredTracks` |
| isDev 按钮 | 已有，Task 2 修正 loading |
| live 成功失败数 | Task 2 `isParseBatch` 含 `downloadJson` |
| 文件名安全化 | Task 1 `safeFilename` |
| 部分失败仍导出 | Task 1 try 内先 parse 再 download |
