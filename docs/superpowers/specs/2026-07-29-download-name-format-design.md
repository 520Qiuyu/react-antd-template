# 下载名称格式设计

日期：2026-07-29  
范围：汽水链接解析页下载设置（`LinkParseSidebar`）与命名逻辑（`downloadSong.ts`）

## 背景

下载文件名目前写死为 `{歌名}-{歌手}.{ext}`。侧栏「下载名称格式」输入框已预留但未接通（`Input` / `downloadNameFormat` 均未落地）。用户需要可自定义模板，用占位符拼出文件名。

## 目标

- 支持自定义下载文件名模板，占位符语法为 `【xxx】`
- 配置持久化到 localStorage（与现有 `downloadFormat` / `preferredQuality` 一致）
- 音频与歌词下载共用同一模板
- 歌单下载可带序号；单曲解析页无序号

## 非目标

- 不做实时文件名预览
- 不做预设模板下拉（Select + 自定义）
- 不清理空占位符两侧的多余分隔符
- 序号不补零（列表 UI 的 `01` 展示可保持不变）
- 不新增后端接口

## 配置

`useConfig` / `window.config` / `DEFAULT_CONFIG` 新增：

```ts
downloadNameFormat: string; // 默认 '【歌名】-【歌手】'
```

下载时若配置为空字符串，回退到默认 `【歌名】-【歌手】`。

## 占位符

| 占位符 | 来源 | 缺省 / 特殊规则 |
|--------|------|-----------------|
| `【序号】` | 调用方传入的列表序号 | 歌单：从 1 起不补零；单曲不传 → `''` |
| `【歌名】` | `title` | 缺省 `未知歌曲` |
| `【专辑名】` | `album` | 缺省 `未知专辑` |
| `【歌手】` | `artist` | 缺省 `未知歌手` |

仅识别上表四个占位符；未知 `【xxx】` 原样保留。

## 替换规则

1. 读取 `window.config.downloadNameFormat`（空则用默认）
2. 将各字段值做非法文件名字符清洗：`[\\/:*?"<>|]` → `_`，并 `trim`
3. 全局替换对应 `【xxx】`
4. 空值原样留下，**不**清理两侧 `-` / `_` / 空格（例如单曲 + `【序号】-【歌名】` 可能得到 `-晴天`）
5. 若替换后主体为空，回退 `未知歌曲`
6. 扩展名由下载逻辑单独拼接，模板不含扩展名

## 侧栏 UI

位置：`LinkParseSidebar`「下载设置」区块，音质选择下方。

- `Input` 绑定 `downloadNameFormat`，`onChange` → `setConfig`
- Input 下方可点击标签：`【序号】` `【歌名】` `【专辑名】` `【歌手】`
  - 有选区/光标：插入到光标处
  - 否则：追加到末尾
- 补充 `fieldInput` 样式，与 `fieldSelect` 视觉一致

## 下载接入

改动 `downloadSong.ts`：

- 抽出（或改造）`buildSongFilename` / `buildLyricFilename`，读取配置模板并接受可选 `index?: number`
- `downloadSongAudio` / `downloadSongLyric` 透传可选 `index`
- 歌单：`PlaylistResult` / `TrackList` 下载时传入 `globalIndex + 1`
- 单曲解析页：不传 `index`

## 错误处理

- 空模板 → 默认模板
- 空文件名主体 → `未知歌曲`
- 非法字符清洗沿用现有逻辑

## 涉及文件

- `src/hooks/useConfig.ts` — 配置字段与默认值
- `src/views/qishui/linkParse/components/LinkParseSidebar/index.tsx` — Input + 插入标签
- `src/views/qishui/linkParse/components/LinkParseSidebar/index.module.less` — `fieldInput` / 标签样式
- `src/views/qishui/linkParse/downloadSong.ts` — 模板解析与命名
- `src/views/qishui/linkParse/components/PlaylistResult/**` — 传序号
- `src/views/qishui/linkParse/components/SongResult/**` — 保持不传序号（若签名变更则适配）
