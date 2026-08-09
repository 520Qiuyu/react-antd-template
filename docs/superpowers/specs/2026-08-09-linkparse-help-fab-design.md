# LinkParse 使用教程 HelpFab 设计

## 目标

在汽水解析页右下角提供显眼的「使用教程」入口，点击后打开飞书图文/视频文档。

## 形态

- 固定右下角圆形 FAB（品牌渐变 + `?`）
- 点击展开玻璃拟态小面板；再次点击或关闭按钮收起
- 首次访问：自动展开 + 呼吸光，约 4 秒后自动收起，`localStorage` 键 `lp-help-tip-seen` 标记已见
- 手动关闭或点击「查看教程」亦标记已见

## 内容

- 标题：使用教程
- 说明：图文说明 + 操作视频，快速上手解析流程
- 主操作：查看教程 → 新标签打开 `HELP_DOC_URL`

## 范围

- 新增 `components/HelpFab/`
- `constants.ts` 增加 `HELP_DOC_URL`
- 挂载于 `linkParse/index.tsx`
- 不改动侧栏「如何获取分享链接」

## 无障碍 / 动效

- FAB / 面板按钮具备 `aria-label`、`aria-expanded`
- `Escape` 关闭；点击外部关闭
- `prefers-reduced-motion` 关闭呼吸与过渡动画
