# 歌单批量解析并下载 JSON

## 背景

开发环境下，歌单曲目列表需要一键「全部解析」后导出 JSON，便于调试或二次使用。入口在 `TrackList` 批量操作栏「下载JSON」按钮（仅 `isDev` 可见）。

## 目标

1. 对当前筛选结果中的曲目批量补齐解析（未解析才请求）。
2. 下载 JSON 文件，结构为：

```json
{
  "歌单名": "xxx",
  "list": [
    {
      "id": "...",
      "title": "...",
      "artist": "...",
      "album": "...",
      "cover": "...",
      "duration": 0,
      "type": "track",
      "urls": [],
      "lrc": "...",
      "lrcText": "..."
    }
  ]
}
```

3. `list` 顺序与传入的筛选列表一致；字段优先取 `fullInfo`，基础信息与 track 互补；含歌词。

## 非目标

- 生产环境暴露该按钮（保持 `isDev`）。
- 强制重新解析（不 `force`）。
- 导出音频文件本身。
- 单独抽公共 util（本次不拆文件，逻辑放在 `PlaylistResult`）。

## 职责划分

| 位置 | 职责 |
| --- | --- |
| `PlaylistResult` | 实现 `handleDownloadAllJson`：解析 → 读最新 store → 映射字段 → `downloadAsJson` → toast |
| `TrackList` | `handleDownloadAllJson` 包装：`batchAction = 'downloadJson'`，调用 `onDownloadAllJson(filteredTracks)`；按钮 loading / disabled |

## 数据流

1. 用户点击「下载JSON」。
2. TrackList：若 `batchAction` 非空则 return；设 `downloadJson`；调用 `onDownloadAllJson(filteredTracks)`；finally 清空。
3. PlaylistResult：
   - 空列表直接 return。
   - `setBatchProgress({ success: 0, failed: 0 })`。
   - `parseTracksBatch(targetTracks, false)`（会 `bumpBatchProgress`，按钮可展示实时成功/失败；已解析跳过）。
   - 按 `targetTracks` 的 id 顺序，从 `playlistHasResult.tracks` 取最新曲目（找不到则用原 track）。
   - 映射导出项：
     - `id` ← track.id
     - `title/artist/album/cover` ← fullInfo 优先，否则 track
     - `duration/type` ← track
     - `urls/lrc/lrcText` ← fullInfo（可空）
   - `downloadAsJson({ 歌单名, list }, safeFilename)`，`downloadAsJson` 已存在于 `@/utils/download`。
   - 文件名：`data.title` 去掉非法路径字符，空则用 `歌单`。
   - toast：`JSON 已导出：解析成功 x，失败 y`；若本次无需解析（`total === 0`）则提示 `JSON 已导出：共 n 首`。

## UI

- `BatchAction` 增加 `'downloadJson'`。
- 按钮 loading：`batchAction === 'downloadJson'`。
- 解析进行中复用 `liveSuccessCount` / `liveFailCount`：将 `isParseBatch` 扩展包含 `downloadJson`，或单独判断后计入 parse 统计展示。
- 计数展示：非 live 时显示 `filteredTracks.length`。

## 错误处理

- 空列表：不操作。
- 部分解析失败：仍导出已有数据（含无 urls 的条目），toast 汇总成功/失败。
- 下载 JSON 本身异常：`msgError`。

## 测试要点

- 未解析歌单：点击后先解析再下载，文件含 urls/歌词（有则非空）。
- 已全部解析：直接下载，无多余请求。
- 筛选后子集：只导出筛选结果且顺序正确。
- 歌单名含特殊字符：文件名可安全保存。
- 非 dev：按钮不渲染。
