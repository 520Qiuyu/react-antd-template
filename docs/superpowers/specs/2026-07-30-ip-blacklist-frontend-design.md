# IP 黑名单管理（前端一期）设计

**日期：** 2026-07-30  
**范围：** 仅前端；本地 mock 数据，不接真实后端 / Redis  
**对齐页面：** 设计稿「黑名单管理」  
**参考实现：** `views/qishui/authInfo`（mock CRUD）、`views/qishui/parseLogs`（统计 + SearchForm + Table）

---

## 1. 目标

在管理后台提供 IP 黑名单管理页，支持：

- 手动添加 / 编辑拉黑记录
- 展示自动拉黑（限流）mock 数据
- 软解除并保留历史
- 全局拦截开关（本地状态）
- 筛选、分页、统计展示

一期不实现真实拦截、Redis 同步、自动拉黑写入、CIDR / IPv6、批量导入。

---

## 2. 菜单位置与路由

| 项 | 值 |
|---|---|
| 父菜单 | 系统管理 |
| path | `blacklist` |
| 完整路由 | `/system/blacklist` |
| name | 黑名单管理 |
| auth | `['blacklist-management']` |
| component | `lazy(() => import('@/views/system/blacklist'))` |

将当前顶级菜单项移入 `system.children`，并修正 import 路径（不再使用 `@/views/qishui/blacklist`）。

---

## 3. 文件组织

```
frontend/src/types/blacklist.ts
frontend/src/views/system/blacklist/
  index.tsx
  index.module.less
  constants.ts
  mock.ts
  utils.ts
  components/
    BlacklistStat/
      index.tsx
      index.module.less
    BlacklistFormModal/
      index.tsx
      index.module.less
```

---

## 4. 数据模型

### 4.1 来源 `BlacklistSource`

| 值 | 展示 | Tag 色 |
|---|---|---|
| `manual` | 手动拉黑 | red |
| `rate_limit` | 限流自动 | orange |

### 4.2 记录状态 `BlacklistStatus`（软删除）

| 值 | 含义 |
|---|---|
| `active` | 生效中 |
| `unblocked` | 已解除 |

### 4.3 过期状态（计算字段，不持久化）

| 条件 | 展示 |
|---|---|
| `expireAt === null` | 永久 |
| `expireAt > now` | 未过期（展示到期时间） |
| `expireAt <= now` | 已过期 |

已过期记录在 `status === 'active'` 时仍算生效记录，除非手动解除。

### 4.4 列表项 `BlacklistListItem`

```ts
interface BlacklistListItem {
  id: string;
  ip: string;
  source: 'manual' | 'rate_limit';
  status: 'active' | 'unblocked';
  expireAt: string | null; // ISO；null = 永久
  reason: string;
  remark?: string;
  createdBy: string;
  ctime: string;
  utime: string;
  unblockedAt?: string | null;
  unblockedBy?: string | null;
}
```

### 4.5 表单值 `BlacklistFormValues`

```ts
type BlacklistDuration = '1h' | '24h' | '7d' | '30d' | 'permanent' | 'custom';

interface BlacklistFormValues {
  ip: string;
  duration: BlacklistDuration;
  customExpireAt?: Dayjs; // duration === 'custom' 时必填
  reason: string;
  remark?: string;
}
```

### 4.6 统计

| 指标 | 计算方式 |
|---|---|
| 黑名单总数 | 全量 mock 中 `status === 'active'` 的条数 |
| 当前页 · 手动拉黑 | 当前页 `source === 'manual'` 条数 |
| 当前页 · 自动拉黑 | 当前页 `source === 'rate_limit'` 条数 |

---

## 5. 页面结构

1. 页头：标题「黑名单管理」+ 副标题（支持手动/自动拉黑；说明文案可写「变更同步至 Redis，实时生效」作为产品说明，一期不接真实同步）
2. `BlacklistStat`：三张统计卡
3. 工具栏：拦截 Switch +「添加黑名单」
4. `SearchForm` 筛选区
5. `Table` + `MyPagination`
6. `BlacklistFormModal`

技术栈与惯例：Ant Design、`SearchForm`、`MyButton`、`MyPagination`、`CopyText`、`useSearchParams`、`useCompRef`、`styles['xxxx']`、事件函数 `handleXxx`。

---

## 6. 交互

### 6.1 全局拦截开关

- 文案：黑名单拦截 · 开启/关闭
- 存储：本地 state + `localStorage`（key 如 `ip-blacklist-enabled`）
- 开启：`msgSuccess`
- 关闭：`message.warning`，提示拉黑记录仍保留但不拦截

### 6.2 筛选

| 字段 | 说明 |
|---|---|
| keyword | IP / 原因 / 备注 |
| source | 全部 / 手动拉黑 / 限流自动 |
| status | 全部 / 生效中 / 已解除；**默认「生效中」** |
| dateRange | 创建时间区间 |

查询重置 `pageNum = 1`；分页默认 `pageSize = 10`。

### 6.3 表格列

IP（`CopyText`）｜来源 Tag｜是否过期｜拉黑时长/过期时间｜拉黑原因｜创建人｜备注｜创建时间｜更新时间｜操作

### 6.4 操作

| 操作 | 行为 |
|---|---|
| 添加 | 打开弹窗；`source` 固定 `manual`；`createdBy` 取当前用户名，无则 `admin` |
| 编辑 | 可改 IP、时长、原因、备注；`source` 不可改 |
| 解除拉黑 | 二次确认 → `status = unblocked`，写入 `unblockedAt` / `unblockedBy` |
| 已解除行 | 仅展示，不可编辑、不可再次解除 |

### 6.5 表单校验与提交

| 字段 | 规则 |
|---|---|
| IP | 必填；IPv4 格式 |
| 拉黑时长 | 必选：1h / 24h / 7d / 30d / 永久 / 自定义 |
| 自定义过期时间 | `custom` 时必填，且晚于当前时间 |
| 拉黑原因 | 必填，最长 200 字 |
| 备注 | 选填，最长 200 字 |

提交时由 `duration` 计算 `expireAt`（永久为 `null`）。  
同一 IP 若已有 **生效中** 记录：阻止重复添加（编辑自身除外），提示「该 IP 已在黑名单中」。

**编辑回填时长：** `expireAt === null` → `permanent`；否则一律回填为 `custom`，并带入当前 `expireAt`（不猜测是否匹配 1h/24h 等预设）。

---

## 7. Mock 策略

- `mock.ts` 预置若干条：手动永久、限流限时、已过期、已解除
- 增删改仅改本地 state；刷新页面重置（与 `authInfo` 一致）
- 自动拉黑仅用于展示，前端不模拟限流写入

---

## 8. 错误与体验

- 表单校验失败：字段级错误，不关弹窗
- 解除：`confirm('确定解除拉黑「x.x.x.x」吗？')`
- 成功：`msgSuccess`
- 弹窗提交、解除操作使用按钮 loading

---

## 9. 明确非目标（一期）

- 真实后端 API / Redis 同步
- 自动拉黑业务写入
- CIDR、IPv6
- 批量导入 / 导出
- 拦截访问日志页
- 权限按钮码细粒度（沿用菜单 auth 即可）

---

## 10. 后续衔接（非本期）

后端就绪后：

1. 新增 `apis` + 替换 mock state 为 `useGetList`
2. 拦截开关改为服务端配置接口
3. 解除改为软删除 API；列表统计改由接口返回
