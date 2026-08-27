# 汽水解析页（LinkParse）设计风格规范

本文档以 `frontend/src/views/qishui/linkParse` 为基准，记录该页的视觉语言、布局骨架与组件配方。后续做同类「文档站点 + 工具台」页面时，优先复用这里的 token 与结构，而不是另起一套绿蓝渐变。

基准入口：`linkParse/index.tsx` + `linkParse/index.module.less`。CSS 变量全部挂在根节点 `.page` 上，前缀为 `--lp-`。

---

## 1. 定位与气质

这不是后台 CRUD 页，也不是纯营销落地页。它是一套 **汽水 Docs 工具站**：

- 骨架学文档站：顶栏 + 左导航 + 中间文档流 + 右侧 TOC。
- 质感学汽水：薄荷绿底、气泡高光、柠檬点缀、玻璃卡片。
- 内容学工具：表单、结果卡、列表、播放器、进度条都嵌在文档流里。

一句话：**薄荷汽水玻璃文档站**。记住三件事：透、亮、润。

| 维度 | 选择 |
| --- | --- |
| 主题 | 浅色，永不做暗色变体（本页未提供 dark token） |
| 主色 | 汽水绿 `#00c27a` |
| 辅色 | 气泡青 `#00b8d4` |
| 点缀 | 柠檬黄 `#ffb020` |
| 表面 | 半透明白 + `backdrop-filter` 模糊 |
| 阴影 | 绿色半透明光晕，不是灰黑阴影 |
| 圆角 | 偏大（8 / 14 / 16 / 20） |
| 动效 | 短、软、上浮；尊重 `prefers-reduced-motion` |

后续页面如果要「像汽水解析」，先问：是否仍是这套三栏文档骨架 + 玻璃卡片？如果是后台表格页，请走 `modal-style.md` 那套管理端语言，不要硬套本规范。

---

## 2. 适用范围

**适用：**

- 汽水相关的公开工具页、说明页、解析结果页
- 需要文档目录、分区标题、玻璃卡片、品牌渐变按钮的页面
- 在现有 LinkParse 内新增区块（新结果卡、新设置项、新浮层）

**不适用：**

- 后台管理列表 / 表单弹窗（见 `docs/code-style/modal-style.md`）
- 需要暗色主题、高密度表格、或 Ant Design 默认蓝主色的页面

---

## 3. 设计原则

### 3.1 Token 优先，禁止硬编码品牌色

品牌色、文字色、阴影、圆角、缓动一律走 `--lp-*`。只有三种例外：

1. 语义成功绿（列表已解析左边条 `#10b981` / `#059669`）
2. 语义失败红（`#ef4444` / `#dc2626`，已有 `--lp-danger` 时优先用变量）
3. 纯白文字叠在渐变按钮上：`#fff`

新增组件时，先在 `.page` 上找变量；找不到再考虑加变量，不要在子组件里另起一套色板。弹窗如果挂在 `body` 下（脱离 `.page`），需要在弹窗根节点 **复制一份必要 token**（见 `CardSecretModal`、`SongParseView` 的 `.confirmWrap`）。

### 3.2 玻璃表面，而不是实心白卡片

典型配方：

```less
background:
  linear-gradient(135deg, rgba(var(--lp-soda-rgb), 0.06), rgba(var(--lp-bubble-rgb), 0.03)),
  rgba(255, 255, 255, 0.55);
backdrop-filter: blur(20px) saturate(1.5);
-webkit-backdrop-filter: blur(20px) saturate(1.5);
border: 1px solid rgba(255, 255, 255, 0.7);
box-shadow:
  var(--lp-shadow-2),
  inset 0 1px 0 rgba(255, 255, 255, 0.9);
```

规律：

- 外层文档壳更透（`--lp-bg-glass: 0.52`）
- 内层操作面板稍实（白 0.5 + 品牌渐变薄罩）
- 边框几乎总是 **半透明白**，不是灰色实线
- 内阴影用 `inset 0 1px 0` 做出顶部高光

### 3.3 文档流，而不是仪表盘网格

中间栏是「一篇文档」：

1. 英文胶囊徽章
2. 超大标题（中文 + 英文渐变强调）
3. 导语（限制约 56ch）
4. `#` 分区标题 + 内容块
5. 结果 / 空状态 / 错误状态嵌在对应分区里

不要把页面做成多块等宽 KPI 卡片墙。信息密度靠分区和结果卡，不靠九宫格。

### 3.4 主操作发光，次操作描边

- **主按钮**：品牌渐变 + 绿色光晕阴影 + hover 上浮 2px + `brightness(1.06)`
- **次按钮（Ghost）**：半透明白底 + 绿色描边 + 品牌字色
- **危险操作**：红色描边 / 红底，不走品牌渐变

同一视觉层级里，主按钮最多一个。

### 3.5 状态用色，不用文案堆砌

| 状态 | 表达 |
| --- | --- |
| 默认 / 空 | 绿色虚线框 + 弱化图标 |
| 成功 / 已绑定 / 已解析 | 实线绿边、左边条、或汽水绿填充 |
| 警告 / 未绑定 / 次数卡 | 柠檬黄虚线或琥珀徽章 |
| 错误 / 失败 | `--lp-danger` + 浅红底 + 虚线或实线红边 |
| 忙碌 | 渐变进度、shimmer、脉冲光晕，降低透明度即可 |

### 3.6 图标只做语义点缀

统一 `@ant-design/icons`。图标不单独做插画系统。尺寸习惯：

- 导航 / 侧栏：16px，`opacity: 0.85`
- 输入框前缀：17px，`--lp-text-3`
- 空状态：28px，`opacity: 0.55`
- FAB：22–24px

---

## 4. Token 系统

全部定义在 `index.module.less` 的 `.page` 上。新页面应原样拷贝这一段，或抽成公共 less 片段，但 **不要改色相**。

### 4.1 品牌 RGB（用于 `rgba(var(--lp-xxx-rgb), a)`）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--lp-soda-rgb` | `0, 194, 122` | 主绿，边框 / 阴影 / 叠色 |
| `--lp-bubble-rgb` | `0, 184, 212` | 气泡青，高光 / hover 阴影 |
| `--lp-lemon-rgb` | `255, 176, 32` | 柠檬黄，警告、点缀、未绑定 |

### 4.2 背景与表面

| Token | 值 | 用途 |
| --- | --- | --- |
| `--lp-bg` | `#ecfbf5` | 页面底色 |
| `--lp-bg-alt` | `#dff7ef` | 备用浅绿 |
| `--lp-bg-soft` | `rgba(255,255,255,0.78)` | 顶栏、引擎条等较实表面 |
| `--lp-bg-glass` | `rgba(255,255,255,0.52)` | 文档主卡片 |
| `--lp-bg-mute` | `#ccefe2` | 封面 / 视频占位 |

页面背景不是纯色，而是三层径向光斑 + 底色：

```less
background:
  radial-gradient(ellipse 55% 42% at 92% 4%, rgba(var(--lp-soda-rgb), 0.2), transparent 58%),
  radial-gradient(ellipse 48% 38% at 6% 92%, rgba(var(--lp-bubble-rgb), 0.18), transparent 55%),
  radial-gradient(ellipse 40% 30% at 50% 50%, rgba(var(--lp-lemon-rgb), 0.07), transparent 60%),
  var(--lp-bg);
```

再用 `::before` 叠 2–3 个白色高光圆斑（`opacity: 0.45`），模拟气泡。新页面保留这层氛围，不要改成纯白或灰色工作台。

### 4.3 文字

| Token | 值 | 用途 |
| --- | --- | --- |
| `--lp-text-1` | `#0f1f18` | 标题、强调、主信息（偏墨绿，不是纯黑） |
| `--lp-text-2` | `#3d5c50` | 正文、导语、次级操作 |
| `--lp-text-3` | `#6b8f82` | 辅助、标签、目录、占位 |

对比度来自「墨绿三档」，不要引入中性灰 `#666` / `#999`。

### 4.4 品牌与渐变

| Token | 值 |
| --- | --- |
| `--lp-brand` | `#00c27a` |
| `--lp-brand-2` | `#00b8d4` |
| `--lp-brand-3` | `#ffb020` |
| `--lp-brand-soft` | `rgba(soda, 0.14)` |
| `--lp-brand-softer` | `rgba(soda, 0.08)` |
| `--lp-primary-hover` | `#009e68` |
| `--lp-gradient` | `135deg, #00c27a → #00c9a7 → #00b8d4 → #5ce1e6` |
| `--lp-gradient-btn` | `135deg, #00b87a → #00c9a7 → #00b4d8` |
| `--lp-gradient-mesh` | 汽水 / 气泡 / 柠檬的低透明线性叠色 |
| `--lp-danger` | `#ef4444` |
| `--lp-danger-soft` | `rgba(239, 68, 68, 0.1)` |

标题里的英文强调词用 `--lp-gradient` + `background-clip: text`，不要改成纯色斜体。

### 4.5 边框、阴影、圆角、尺寸

| Token | 值 | 用途 |
| --- | --- | --- |
| `--lp-divider` | `rgba(soda, 0.12)` | 分区顶部分割线、目录竖线 |
| `--lp-border` | `rgba(soda, 0.18)` | 常规描边 |
| `--lp-shadow-1` | `0 2px 8px rgba(soda, 0.1)` | 轻卡片、筛选条 |
| `--lp-shadow-2` | `0 12px 40px rgba(soda, 0.16)` | 结果卡、侧栏抽屉、弹窗 |
| `--lp-shadow-3` | 白描边 + 绿光晕 | 文档主壳 |
| `--lp-shadow-glow` | `0 0 48px rgba(bubble, 0.2)` | 文档主壳外发光 |
| `--lp-radius-sm` | `8px` | 小控件、chip、筛选输入 |
| `--lp-radius` | `14px` | 默认卡片 |
| `--lp-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | 全局缓动 |
| `--lp-sidebar-width` | `272px` | 左侧栏 |
| `--lp-aside-width` | `200px` | 右侧 TOC |
| `--lp-content-max` | `820px` | 文档栏最大宽 |
| `--lp-layout-max` | `1480px` | 整页最大宽 |

卡片圆角习惯：

- 文档主壳：`calc(var(--lp-radius) + 6px)` ≈ 20px
- 结果卡 / Hero：`+ 4px` ≈ 18px
- 内嵌面板 / 播放条：`+ 2px` ≈ 16px
- 按钮：主操作 11px，小按钮 8px
- 胶囊：`999px`

### 4.6 排版基数

- 页面字号：`15px`
- 行高：`1.65`
- 标题字重：`650`（分区 / 导航）或 `800`（页面大标题）
- 字间距：大标题 `-0.04em`，分区标题 `-0.02em`，小号标签 `0.06em` + `uppercase`
- 等宽：`ui-monospace, "Cascadia Code", Consolas, monospace`（trackId、卡密、文件名预览）
- 数字：进度、序号、时长用 `font-variant-numeric: tabular-nums`

本页 **没有指定展示字体**，跟随全局字体。不要为了「更设计」引入 Inter / Space Grotesk 等新字体。

---

## 5. 页面骨架

```
.page                    100vh，氛围背景
├── header.nav           sticky 56px 玻璃顶栏
├── .layout              272px 侧栏 + 内容
│   ├── LinkParseSidebar
│   └── .content         820px 文档 + 200px 右侧栏
│       ├── .docArea     SongParseView / PlaylistParseView
│       └── PageAside    TOC + CardSecretPanel
├── CardSecretModal
└── HelpFab
```

### 5.1 顶栏 `.nav`

- 高度 56px，`sticky; top: 0; z-index: 10`
- 背景 `rgba(255,255,255,0.55)` + `blur(22px) saturate(1.6)`
- 底部分割用半透明白，而不是实线灰
- 内宽 `max-width: 1480px`，左右 `24px`，元素间距 `16px`

组成从左到右：

1. **品牌**：34×34 圆角 10px 渐变 Logo +「汽水解析」+ 灰色小字 `Docs`
2. **卡密 Chip**：`margin-right: auto` 把它推到品牌右侧、导航左侧
3. **导航链接**：歌曲解析 / 歌单解析 / 外链
4. **汉堡按钮**：仅 `≤960px` 显示

卡密 Chip 是顶栏里唯一的「状态物」：

- 未绑定：柠檬虚线边 + 琥珀字 `#a16207` + 浅柠檬底
- 已绑定：绿色实线边 + 品牌字 + `--lp-brand-softer` 底

不要把卡密做成普通按钮或下拉菜单。

### 5.2 左侧栏

- `sticky` 贴顶，玻璃底 `rgba(255,255,255,0.42)` + `blur(22px)`
- 右描边半透明白
- 内边距 `28px 18px 40px 24px`

结构：

- 分组标题：11px、字重 650、`letter-spacing: 0.08em`、`uppercase`、`--lp-text-3`
- 导航项：13.5px / 字重 500，圆角 10px，左图标 16px
- 激活态：绿→青横向渐变底 + **左侧 3px inset 品牌条** + 字重 600
- hover：品牌色字 + `--lp-brand-softer` 底

底部「下载设置」是嵌在侧栏里的小玻璃卡（`--lp-gradient-mesh`），不是跳去新路由。设置控件（Select / Input / 三段 Radio）圆角 10px，白 0.72 底，绿边 0.18。

文件名预览框：左侧 inset 3px 品牌条 + 等宽字 + token 高亮绿底 + 扩展名柠檬色。

`≤960px`：侧栏改为 `fixed` 左抽屉，`translateX(-105%)` 滑入，宽 `min(300px, 86vw)`，实底 `--lp-bg` + `--lp-shadow-2`。

### 5.3 中间文档

`.content`：`grid` 两列，`gap: 0 40px`，内边距 `28px 40px 64px 32px`。

`.doc`（歌曲 / 歌单视图共用配方）：

- 最大宽 820px
- 内边距 `24px 28px 32px`（小屏 `20px 18px 28px`）
- 玻璃壳 + `--lp-shadow-3` + `--lp-shadow-glow`
- 入场 `fadeUp 0.55s`

页头固定三段：

```tsx
<div className={styles['badge']}>图标 + 英文名</div>
<h1 className={styles['title']}>中文标题 <em>English</em></h1>
<p className={styles['lead']}>一句话说明能力边界，约 56ch。</p>
```

徽章：胶囊、白字、`--lp-gradient-btn`、11px、字重 700、`uppercase`、`letter-spacing: 0.06em`。

大标题：`clamp(2rem, 3vw, 2.6rem)`，字重 800，行高 1.15；`<em>` 走渐变文字。小屏降到 `1.85rem`。

### 5.4 右侧栏

- 宽 200px，`sticky`
- 标题「On this page」：与侧栏分组标题同级（11px uppercase）
- 链接：12.5px、`--lp-text-3`、左侧 1px `--lp-divider`；hover 变品牌色并加粗左边线
- 下方挂 `CardSecretPanel`（卡密详情卡）
- `≤1200px`：**整栏隐藏**（含卡密卡）。不要改成折叠进文档流，除非产品明确要求

目录数据由当前视图写入 `parseStore.tocSections`，随结果出现增补锚点（如音质、歌词）。

### 5.5 层级

| 层 | z-index |
| --- | --- |
| 背景光斑 `::before` | 0 |
| 顶栏 | 10 |
| 遮罩（若启用） | 90 |
| 侧栏抽屉 | 95 |
| 主 layout | 99 |
| HelpFab | 999 |

---

## 6. 分区与文档组件

### 6.1 `DocSectionTitle`

每个功能块必须用这个组件，禁止手写 `h2` 冒充分区。

- 默认：顶部分割线 `--lp-divider` + 上边距 36px
- `first`：去掉顶线，贴近页头
- 标题行：绿色 `#`（opacity 0.7）+ 1.15rem / 字重 650
- `id` 必须可被右侧 TOC 和 `scrollIntoView` 使用

### 6.2 `ParseFormPanel`

输入是页面第一交互，视觉权重仅次于页头。

- 面板：品牌薄渐变 + 白 0.5 + `blur(18px)` + 白边 + 双阴影（外绿光 + 内高光）
- 内边距 22px，圆角 `radius + 2`
- 提示条：气泡青浅底 + 柠檬图标 + 可内嵌 `<code>`（绿浅底、圆角 4px）
- 输入：高 48px，左内边距 42px 给图标，圆角 14px；focus 时品牌描边 + `0 0 0 4px var(--lp-brand-soft)` 光环
- 主按钮高 42px；loading 时自定义白圈 spin，不要用 Ant Spin 替代主按钮

### 6.3 空 / 错状态 `ParseState`

- 空：绿色虚线、居中、图标 28px 半透明、白 0.35 玻璃底
- 错：红色虚线、`--lp-danger-soft` 底、`role="alert"`
- 都带 `fadeUp 0.4s`
- 空状态文案说明「结果将出现在这里」，不要放插画或按钮抢主 CTA

---

## 7. 结果与数据展示

### 7.1 歌曲结果卡

两列：`148px` 封面 + 信息。封面圆角约 16px，背后有模糊渐变光斑；播放中光斑 `coverPulse`，封面加 2px 品牌描边。

信息层级：专辑（text-3）→ 标题 1.7rem / 800 → 艺人 + 24px 圆头像 → 等宽 trackId 芯片 → 操作按钮贴底。

视频作品把封面位换成 9:16 舞台，播放中同样加品牌描边。

### 7.2 信息 Chip 三色轮换

`infoGrid` 三列（小屏一列）。第 1/2/3 个 chip 分别用汽水绿、气泡青、柠檬黄的浅渐变底 + 对应色边。这是本页少有的「三色同时出场」，只用于并列元数据，不要用在按钮上。

标签：11px、字重 700、uppercase、`letter-spacing: 0.05em`、`--lp-text-3`。

### 7.3 音质列表

每行是玻璃条，hover 向右微移 `translateX(2px)`。下载进度用 CSS 变量 `--progress` 做从左到右的绿色填充，不要用 Ant Progress 默认样式。

- 进行中：绿半透明填充到 `--progress`
- 完成：实心成功绿渐变
- 失败：浅红底 + 红边

### 7.4 歌词盒

玻璃滚动区，`max-height: 240px`，行高 1.8。右上角 segment：未选中 text-3，选中白字渐变胶囊。滚动条 6px、绿色半透明圆头。

### 7.5 歌单 Hero

与歌曲卡同配方，但主色偏气泡青（封面阴影用 bubble，背景薄青罩）。封面 120px（小屏 96px）。统计用胶囊 pill：绿描边、白 0.6 底、图标品牌色。

### 7.6 曲目列表

外层一张玻璃列表，行高用 1px `rgba(soda, 0.08)` 分隔。行 hover：绿→青横向浅渐变。

行状态靠 **左边 3px 色条 + 行背景**，不要靠整行变粗边框：

| 状态 | 左边条 | 背景 |
| --- | --- | --- |
| 默认 | 透明 | 透明，hover 浅绿 |
| 已解析有地址 | `#10b981` | 成功绿横向渐变 |
| 已解析无地址 | `#94a3b8` | 灰渐变 + `grayscale(0.62)` |
| 忙碌 | — | `opacity: 0.85` |

序号品牌色、tabular-nums；封面 44px 圆角 8px；视频角标用独立青蓝渐变（与主按钮绿青渐变刻意区分）。

筛选条是玻璃条，并 **覆写** SearchForm / Ant 默认蓝：选择器 34px 高、绿边、focus 时 `0 0 0 3px var(--lp-brand-soft)`。

批量按钮上的数量徽标：

- Ghost 上：浅绿底 + 品牌字
- Primary 上：白 0.22 底 + 白字（保证叠在渐变上可读）
- 成功 / 失败另用绿 / 红语义色

### 7.7 播放器

音频条与视频控制条共用气质：玻璃条、44px 圆形渐变播放键、8px 圆角进度、白底绿边滑块。缓冲层用气泡青，播放层用按钮渐变并带绿光。准备中走 `shimmer`，忙碌播放键走 `pulseGlow`。

视频舞台 9:16，底部 42% 黑色渐变遮罩；LIVE 胶囊叠在左上。

---

## 8. 按钮配方（必须复用，不要重造）

三档即可覆盖 90% 场景。歌单共享样式在 `PlaylistResult/components/shared.module.less`。

### 主按钮

```less
color: #fff;
background: var(--lp-gradient-btn);
box-shadow: 0 6px 24px rgba(var(--lp-soda-rgb), 0.38);
border-radius: 11px; // 大按钮；小按钮 8px
font-weight: 600;
min-height: 42px; // 大；列表内 34px；更小 30px

&:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-2px); // 列表内小按钮可只 brightness
}
&:active {
  transform: scale(0.98);
}
```

### Ghost 按钮

```less
color: var(--lp-brand);
background: rgba(255, 255, 255, 0.5);
border: 1px solid rgba(var(--lp-soda-rgb), 0.25);

&:hover {
  color: var(--lp-primary-hover);
  border-color: rgba(var(--lp-soda-rgb), 0.4);
  background: var(--lp-brand-softer);
}
```

### 危险 Ghost

红字 + 红边 + 浅红 hover 底。重试、删除走这条，**不要**做成红色渐变主按钮。

禁用：`opacity: 0.55; cursor: not-allowed`。大主按钮 loading：`opacity: 0.8; pointer-events: none` + 内嵌 spin。

---

## 9. 浮层、弹窗、FAB

### 9.1 卡密弹窗 / Confirm

Ant 弹窗内容区改成自定义玻璃卡，而不是用默认白底：

- 圆角 16px
- 背景：品牌薄渐变 + 白 0.92 + `blur(20px)`
- 居中 48px 渐变图标（卡密）或纯标题（confirm）
- 标题 17–18px / 650 / `-0.02em`
- 说明 text-3、居中、13px
- 双按钮各 `flex: 1`，高 42px，圆角 11px
- 输入 focus：`0 0 0 3px rgba(soda, 0.14)`

因为 Modal 渲染到 `body`，必须在弹窗根节点重写 `--lp-*`，否则变量丢失。

Confirm 的 `wrapClassName` / 按钮 className 需要同时覆盖 Ant 6 的 `.ant-modal-container` 结构（见 `SongParseView/index.module.less` 注释）。取消按钮走 Ghost，确认走渐变主按钮。

### 9.2 HelpFab

- 固定右下：桌面 `24px`，小屏 `16px`
- 圆形 52px（小屏 48px），渐变 + 绿光晕 + 内高光
- hover：上浮 2px + `scale(1.04)`
- 展开面板：280px 玻璃卡，从右下 `translateY(10px) scale(0.94)` 出现
- 首次访问可自动展开 + 呼吸环，之后用 localStorage 记住
- `z-index: 999`，高于侧栏抽屉

### 9.3 卡密详情卡（右侧）

小玻璃卡，右下角径向光斑随类型变色：

- 时长卡 → 气泡青光斑，徽章字 `#087f8c`
- 次数卡 → 柠檬光斑，徽章字 `#9a6700`
- 告警 → 红边
- 标题用渐变文字
- 进度条 6–7px 圆头；正常绿青或柠檬→绿；满格改橙→红并加红光

状态徽章 / Banner 只用两态：`ok` 绿、`bad` 红，不要引入第三种「处理中」徽章（处理中放引擎条）。

### 9.4 引擎状态条

一条横幅，用 `data-tone="loading | ready | error"` 换肤：

- loading：青边 + 渐变图标底 + 4px 渐变进度
- ready：绿边 + 浅绿渐变底
- error：红边 + 红标题 + 红描边「重试」

不要用 Toast 替代这条常驻状态。

---

## 10. 动效

全局缓动：`--lp-ease`（`cubic-bezier(0.22, 1, 0.36, 1)`）。时长习惯 0.15–0.28s，入场可到 0.45–0.55s。

| 动画 | 用法 |
| --- | --- |
| `fadeUp` | 文档、结果、空/错状态：`translateY(12px)` → 0 |
| `engineFadeUp` / `secretIn` | 更短的上浮 8px |
| `previewIn` | 文件名预览刷新，仅 2px |
| `coverPulse` | 封面光斑呼吸 |
| `pulseGlow` | 播放键忙碌 |
| `shimmer` | 进度未知 |
| `blink` | LIVE / 状态点 |
| `helpPulse` | FAB 首次引导 |
| `spin` | 主按钮 loading |

交互反馈约定：

- 主按钮 hover：`translateY(-2px)` + 更亮 + 阴影改偏青
- 主按钮 active：`scale(0.98)`
- 列表行 hover：背景渐变，不位移（音质行例外可 `translateX(2px)`）
- 侧栏抽屉：`transform 0.28s`

**必须**在页面根或组件内写：

```less
@media (prefers-reduced-motion: reduce) {
  .page,
  .page * {
    animation: none !important;
    transition: none !important;
  }
}
```

独立组件（HelpFab、侧栏预览）若可能脱离该选择器，要自己补一份。

---

## 11. 响应式断点

只使用现有三档，不要新增 768 / 1024 除非版式真的折断。

| 宽度 | 行为 |
| --- | --- |
| `> 1200` | 完整三栏 |
| `≤ 1200` | 隐藏右侧 TOC（含卡密卡），文档仍居左 |
| `≤ 960` | 顶栏导航隐藏，汉堡出现；侧栏变抽屉；文档内边距缩小；歌曲卡 / Hero 改单列；FAB 缩小 |
| `≤ 560` | 大标题缩小；表单按钮通栏；音质行操作折到下一行；曲目行改双行网格；播放器换行 |

触控友好：主按钮不低于 42px，列表操作不低于 30px，顶栏汉堡 40px。

---

## 12. 无障碍

本页已形成习惯，新交互按同样标准：

- 真实按钮用 `<button type="button">`，不要用 `div onClick`
- 图标按钮必须有 `aria-label`
- 导航：`role="banner"`、`aria-label`、当前项 `aria-current="page"`
- 侧栏抽屉：`aria-expanded`；点击外部关闭
- 表单：`label htmlFor` + 输入 `aria-label`
- 空状态 `aria-live="polite"`；错误 `role="alert"`
- 进度条：`role="progressbar"` + `aria-valuenow`
- focus-visible：品牌描边或 `outline: 2px solid` + offset 2px，不要 `outline: none` 后无替代
- 外链：`target="_blank"` + `rel="noopener noreferrer"`

---

## 13. 代码约定

与仓库前端规则一致，本页额外强调：

1. 样式文件：CSS Modules + Less，类名 `styles['cardName']`。
2. 状态类：`isActive` / `isOpen` / `isBound` / `isLoading` / `isPulse`，用 `classNames` 拼接。
3. 覆盖 Ant 时写在模块里 `:global(.ant-xxx)`，并加 `!important` 只打在必须压过 Ant 的属性上（边框色、背景、圆角、阴影）。
4. 事件函数 `handleXxx`。
5. 页面组件里的异步提交要有 loading。
6. 能复用现成块就复用：`DocSectionTitle`、`ParseFormPanel`、`ParseState`、`shared.module.less` 的按钮。
7. 不要删除已有注释（尤其是 Ant 6 DOM 结构说明）。
8. CSS 变量挂在 `.page`；传送到 `document.body` 的节点自行拷贝 token。

---

## 14. 禁止项

- 禁止改用紫色渐变、蓝色 Ant 默认主色、灰色 Material 阴影
- 禁止实心纯白大卡片替代玻璃表面（弹窗可略实，但仍要薄渐变罩）
- 禁止新做一套圆角体系（例如全面 4px 或全面 24px）
- 禁止页面大标题不用渐变 `<em>`、徽章不用胶囊
- 禁止分区标题写成普通 `h2` 而不带绿色 `#`
- 禁止主按钮和 Ghost 在同一组里视觉权重反转
- 禁止列表选中态用粗外框，应用左边条 + 浅渐变底
- 禁止忽略 `prefers-reduced-motion`
- 禁止在文档栏做多列仪表盘；KPI 用 chip / pill
- 禁止把右侧 TOC 的英文小标题改成花哨装饰字体
- 禁止为「更炫」加粒子、噪点贴图、自定义鼠标；现有光斑已经够用

---

## 15. 新页面落地清单

做「类似汽水解析」的新页时，按这次序搭：

1. 根节点复制 `.page` 的全部 `--lp-*` 与三层径向背景。
2. 搭 `nav`（56px 玻璃）+ `layout`（272 / 内容 / 200）。
3. 中间做 `.doc` 玻璃壳：徽章 → 大标题 → 导语。
4. 内容用 `DocSectionTitle` 切开；第一块放主表单。
5. 主 CTA 用渐变按钮，次操作用 Ghost。
6. 结果用玻璃卡；列表用左边条状态；进度用 `--progress`。
7. 空 / 错用虚线状态块。
8. 补 `≤1200` / `≤960` / `≤560` 三档。
9. 补 reduced-motion、aria-label、focus-visible。
10. 若有 Modal / Confirm，在传送门根节点重写 token 并套玻璃配方。

---

## 16. 组件对照（改样式时先找这里）

| 视觉块 | 路径 |
| --- | --- |
| Token / 顶栏 / 布局 | `linkParse/index.module.less` |
| 左导航 + 下载设置 | `components/LinkParseSidebar/` |
| 右 TOC | `components/PageAside/` |
| 分区标题 | `components/DocSectionTitle/` |
| 解析表单 | `components/ParseFormPanel/` |
| 空 / 错 | `components/ParseState/` |
| 歌曲 / 歌单文档壳 | `SongParseView/`、`PlaylistParseView/` |
| 歌曲结果 / 音质 / 歌词 | `components/SongResult/` |
| 歌单 Hero | `PlaylistResult/components/PlaylistHero/` |
| 曲目列表 / 筛选覆写 | `PlaylistResult/components/TrackList/` |
| 小按钮共享 | `PlaylistResult/components/shared.module.less` |
| 音频 / 视频播放 | `SongPlayer/`、`VideoPlayer/` |
| 引擎条 | `EngineStatus/` |
| 卡密卡 / 弹窗 | `CardSecretPanel/`、`CardSecretModal/` |
| 帮助 FAB | `HelpFab/` |

Ant 表单弹窗若属于后台管理，不要参考本文件，改看 `docs/code-style/modal-style.md`。
