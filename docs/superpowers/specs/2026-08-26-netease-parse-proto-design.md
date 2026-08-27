# 网易云音乐解析静态原型设计

## 目标

在 `frontend/proto/netease.html` 交付一份单文件静态交互原型：骨架与组件配方对齐汽水解析页（`frontend/proto/index.html` 与 `frontend/docs/code-style/linkparse-design-style.md`），色相改为网易云红 `#c20c0c`。功能演示单曲 / 歌单 / 专辑 / 歌手四种解析结果，不接真实接口。

不改 React 页 `views/neteaseMusic/parse`，不改路由。

## 气质

浅色玻璃文档站。透、亮、润。永不做暗色变体。

主色网易云红 `#c20c0c`，辅色墨酒红 `#8a0e0e`，点缀暮霭玫瑰 `#a67c76`。表面半透明白 + `backdrop-filter`。阴影走低透明墨色与朱红，不要金黄、不要灰黑 Material 阴影。圆角沿用 8 / 14 / 16 / 20。动效短、软、上浮；尊重 `prefers-reduced-motion`。

## Token

CSS 变量挂在 `:root`，前缀 `--lp-`，语义与汽水页一一对应，只换色相。禁止在子块硬编码品牌色。

| Token | 值 |
| --- | --- |
| `--lp-soda-rgb` | `194, 12, 12`（`#c20c0c`） |
| `--lp-bubble-rgb` | `90, 18, 18`（墨酒红） |
| `--lp-lemon-rgb` | `166, 124, 118`（暮霭玫瑰，第三色轮换，禁止金黄） |
| `--lp-bg` | `#F5F2F1` |
| `--lp-bg-alt` | `#EEE9E8` |
| `--lp-bg-mute` | `#E4D8D6` |
| `--lp-text-1` | `#1A1414` |
| `--lp-text-2` | `#5A504E` |
| `--lp-text-3` | `#8A7D7A` |
| `--lp-brand` | `#c20c0c` |
| `--lp-brand-2` | `#8a0e0e` |
| `--lp-brand-3` | `#a67c76` |
| `--lp-primary-hover` | `#9a0a0a` |
| `--lp-gradient` | `135deg, #c20c0c → #8a0e0e` |
| `--lp-gradient-btn` | `180deg, #d41414 → #c20c0c → #a50b0b` |
| `--lp-danger` | `#ef4444` |

页面背景：三层径向光斑（右上红 0.2、左下深洋红 0.18、中央淡金 0.07）叠 `--lp-bg`，再用 `body::before` 叠 2–3 个白色高光圆斑。

语义例外与汽水相同：成功绿 `#10b981`、失败红走 `--lp-danger`、渐变按钮上的字用 `#fff`。

## 骨架

```
body
├── header.nav          sticky 56px 玻璃顶栏
├── overlay             ≤960px 侧栏遮罩
├── .layout
│   ├── aside.sidebar   272px，仅「参考」
│   └── .content
│       ├── main.doc    单页文档，Segment 切模式
│       └── aside.toc   200px On this page
```

顶栏从左到右：34×34 圆角 10px 红音符 Logo +「网易云解析」+ 灰色小字 `Docs`；右侧仅外链「网易云音乐」（`https://music.163.com/`，`target="_blank"` + `rel="noopener noreferrer"`）。**不放歌曲 / 歌单导航。** `≤960px` 出现汉堡，打开左侧抽屉。

左侧栏分组标题「参考」：

- 如何获取分享链接 → 滚到 `#guide-share`
- 字段说明 → 滚到 `#guide-fields`

底部玻璃卡写明：本页为静态原型，解析演示 mock，接入后端后改真实接口。

中间文档固定三段页头（文案随 Segment 变）：

1. 英文胶囊徽章：`Song` / `Playlist` / `Album` / `Artist Parse`
2. 大标题：`单曲解析` / `歌单解析` / `专辑解析` / `歌手解析` + 对应英文 `<em>`
3. 导语约 56ch

分区一律 `#` + 标题，`id` 可供 TOC / `scrollIntoView`。

右侧 TOC 标题「On this page」。下方品牌说明卡：「网易云音乐 · Docs」。`≤1200px` 整栏隐藏。

## 模式切换

页面只有一个文档壳、一个表单。模式用输入区 Segment 切换，不在左侧、不在顶栏切换。

Segment 位置：`# 输入链接` 标题之下、hint 条之上。全宽胶囊轨道：玻璃底 + 主色 0.18 描边；四等分「单曲 | 歌单 | 专辑 | 歌手」。`≤560` 改为 2×2、圆角 16px。选中：白字 + `--lp-gradient-btn` + 浅红光晕；未选中：`--lp-text-3`。高度 36–40px。左右方向键循环切换，当前项 `aria-selected="true"`，容器 `role="tablist"`。

切到另一模式时：

1. 换徽章、标题、导语、hint、placeholder、默认示例链接
2. 解析按钮文案改为「解析歌曲」或「解析歌单」
3. 结果区重置为空状态（不保留上一模式结果）
4. 重建 TOC；歌曲 TOC 含音质列表、歌词，歌单 TOC 不含这两项
5. 不整页跳转。可用 `#song` / `#playlist` / `#album` / `#artist` 记录当前模式，刷新后恢复

## 表单与状态

hint：

- 歌曲：支持完整分享文案或纯链接，示例 `海阔天空 https://music.163.com/song?id=347230`
- 歌单：请使用歌单分享链接；歌曲链接请切到「歌曲」

输入高 48px，左图标，focus 时品牌描边 + `0 0 0 4px var(--lp-brand-soft)`。主按钮渐变 + loading 白圈 spin；Ghost「清空」。同一组里主按钮只有一个。

| 场景 | 表现 |
| --- | --- |
| 未解析 | 品牌色（红）虚线空状态，图标 28px 半透明，「解析结果将显示在这里」；`aria-live="polite"` |
| 空提交 | 红虚线错误「请先粘贴分享链接」；`role="alert"` |
| 解析中 | 主按钮 `is-loading`，约 700ms |
| 成功 | 空/错隐藏，结果 `fadeUp` |
| 清空 | 输入清空并 focus，结果退回空状态；Segment 保持当前模式 |

任意非空文本都出对应模式的 mock，便于看样式。不做真实 URL 校验。

## 歌曲结果

两列玻璃卡：148px 封面（背后模糊红金光斑）+ 信息。层级：专辑 → 标题 1.7rem / 800 → 艺人 + 24px 圆头像 → 等宽 `songId` 芯片 → 操作贴底（复制 ID、复制歌词）。

`infoGrid` 三列 Chip：艺人（红）、专辑（深洋红）、音质数（金）。

音质三档：标准 mp3、较高 mp3、无损 flac。行玻璃条，hover `translateX(2px)`。Ghost「复制链接」。

歌词盒 `max-height: 240px`，行高 1.8，预填 LRC 文本。

Mock 曲目：Beyond《海阔天空》，`songId` `347230`。默认输入：`海阔天空 https://music.163.com/song?id=347230`。

## 歌单结果

Hero 与歌曲卡同配方，主色偏深洋红薄罩。封面 120px。统计胶囊：曲目数、歌单 ID。

筛选条玻璃底，按歌名 / 艺人过滤。曲目行：序号（品牌色、tabular-nums）+ 44px 封面 + 标题/艺人 + 时长 + Ghost「查看」。试听曲目用琥珀「试听 30s」标签，不放按钮。行 hover 红→洋红浅渐变，不用粗外框。「查看」仅作视觉占位，点击不跳转、不切 Segment（与汽水原型一致）。

Mock 歌单：云音乐热歌榜，`playlistId` `3778678`，8 首（含 2 首试听）。默认输入：`https://music.163.com/playlist?id=3778678`。

## 参考分区

文档底部固定两段，不随 Segment 隐藏：

- `#guide-share` 如何获取分享链接：App 打开歌曲/歌单 → 分享 → 复制链接；可粘贴整段文案。
- `#guide-fields` 字段说明：歌曲对齐 `title / artist / album / cover / urls / lrc`；歌单对齐 `id / title / cover / owner / tracks`。

侧栏点击这两项只滚动，不改变 Segment。

## 明确不做

- 卡密 Chip / 弹窗 / 右侧卡密卡
- 音频 / 视频播放器
- 下载引擎、进度条、文件名设置
- HelpFab
- 专辑 / MV / 电台解析
- 真实网易云接口
- React 落地（`views/neteaseMusic/parse`）

## 响应式与无障碍

断点只使用现有三档：

| 宽度 | 行为 |
| --- | --- |
| `> 1200` | 完整三栏 |
| `≤ 1200` | 隐藏右侧 TOC |
| `≤ 960` | 汉堡 + 侧栏抽屉；歌曲卡 / Hero 单列 |
| `≤ 560` | 标题缩小；按钮通栏；音质行操作折行；曲目行改双行网格 |

无障碍：真实 `<button type="button">`；图标按钮 `aria-label`；空状态 `aria-live="polite"`；错误 `role="alert"`；`focus-visible` 品牌描边；`prefers-reduced-motion` 关闭动画与过渡。

字体跟随汽水原型：Plus Jakarta Sans + Noto Sans SC（本文件是独立 HTML，不走 React 全局字体）。图标用 Remix Icon。
