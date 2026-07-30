# IP Blacklist Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在系统管理下实现 IP 黑名单管理前端页（mock 数据，含手动添加/编辑、软解除、筛选分页、拦截开关）。

**Architecture:** 对齐 `authInfo` mock CRUD + `parseLogs` 统计卡片。本地 state 管理列表；工具函数计算过期与时长；FormModal 处理添加/编辑。

**Tech Stack:** React + TypeScript + Ant Design + less modules + 项目内 `SearchForm` / `MyModal` / `MyButton` / `MyPagination` / `CopyText` / `useSearchParams` / `useCompRef` / `useVisible` / `useUser`

**Spec:** `docs/superpowers/specs/2026-07-30-ip-blacklist-frontend-design.md`

## Global Constraints

- 仅前端 mock，不接 API / Redis
- 菜单放在「系统管理」下，路由 `/system/blacklist`
- 软删除：`status: active | unblocked`
- 时长：预设 + 自定义；编辑回填：永久→`permanent`，否则→`custom`
- 事件函数 `handleXxx`；样式 `styles['xxxx']`；中文 UI
- 不擅自提交 git（除非用户明确要求）

## File Map

| 文件 | 职责 |
|---|---|
| `src/types/blacklist.ts` | 类型定义 |
| `src/views/system/blacklist/constants.ts` | 枚举文案、时长选项、localStorage key |
| `src/views/system/blacklist/utils.ts` | IPv4 校验、过期判断、时长→expireAt、过滤 |
| `src/views/system/blacklist/mock.ts` | 预置 mock 数据 |
| `src/views/system/blacklist/components/BlacklistStat/` | 顶部统计 |
| `src/views/system/blacklist/components/BlacklistFormModal/` | 添加/编辑弹窗 |
| `src/views/system/blacklist/index.tsx` | 主页面 |
| `src/router/menu.tsx` | 菜单挪到 system 下 |

---

### Task 1: Types + constants + utils + mock

**Files:**
- Create: `src/types/blacklist.ts`
- Create: `src/views/system/blacklist/constants.ts`
- Create: `src/views/system/blacklist/utils.ts`
- Create: `src/views/system/blacklist/mock.ts`

- [ ] **Step 1: 创建类型**

```ts
export type BlacklistSource = 'manual' | 'rate_limit';
export type BlacklistStatus = 'active' | 'unblocked';
export type BlacklistDuration = '1h' | '24h' | '7d' | '30d' | 'permanent' | 'custom';
export type BlacklistExpireStatus = 'permanent' | 'valid' | 'expired';

export interface BlacklistListItem {
  id: string;
  ip: string;
  source: BlacklistSource;
  status: BlacklistStatus;
  expireAt: string | null;
  reason: string;
  remark?: string;
  createdBy: string;
  ctime: string;
  utime: string;
  unblockedAt?: string | null;
  unblockedBy?: string | null;
}

export interface BlacklistFormValues {
  ip: string;
  duration: BlacklistDuration;
  customExpireAt?: string; // ISO，custom 时使用
  reason: string;
  remark?: string;
}
```

- [ ] **Step 2: constants** — SOURCE/STATUS 文案色、DURATION_OPTIONS、`IP_BLACKLIST_ENABLED_KEY = 'ip-blacklist-enabled'`

- [ ] **Step 3: utils**
  - `isValidIpv4(ip: string): boolean`
  - `getExpireStatus(expireAt: string | null, now?: dayjs.Dayjs): BlacklistExpireStatus`
  - `resolveExpireAt(duration, customExpireAt?): string | null`
  - `filterBlacklistList(list, params): BlacklistListItem[]`

- [ ] **Step 4: mock** — 至少 4 条：手动永久、限流未过期、限流已过期、已解除

- [ ] **Step 5: 自测** — 在页面接入前用控制台或临时断言确认 utils 行为（实现时直接写对即可）

---

### Task 2: BlacklistStat

**Files:**
- Create: `src/views/system/blacklist/components/BlacklistStat/index.tsx`
- Create: `src/views/system/blacklist/components/BlacklistStat/index.module.less`

**Interfaces:**
- Props: `{ totalActive: number; pageManualCount: number; pageAutoCount: number }`

- [ ] **Step 1: 三列统计卡** — 黑名单总数 / 当前页·手动 / 当前页·自动；手动红色、自动橙色描述；grid 3 列（参考 ParseLogStat 样式）

---

### Task 3: BlacklistFormModal

**Files:**
- Create: `src/views/system/blacklist/components/BlacklistFormModal/index.tsx`
- Create: `src/views/system/blacklist/components/BlacklistFormModal/index.module.less`

**Interfaces:**
- `open(record?: BlacklistListItem)`
- `onSuccess(values: BlacklistFormValues, record?: BlacklistListItem)`
- Props 另传 `existingActiveIps: string[]` 或在 onSuccess 外由父级校验重复 IP；**推荐父级校验**，弹窗内只做字段校验

- [ ] **Step 1: 弹窗字段** — IP、时长 Select、自定义 DatePicker（duration===custom 时）、原因、备注
- [ ] **Step 2: 编辑回填** — expireAt null → permanent；否则 custom + dayjs(expireAt)
- [ ] **Step 3: 校验** — IPv4、custom 必填且晚于现在、原因必填 max 200、备注 max 200

---

### Task 4: 主页面 + 菜单

**Files:**
- Create: `src/views/system/blacklist/index.tsx`
- Create: `src/views/system/blacklist/index.module.less`
- Modify: `src/router/menu.tsx` — 删除顶级 blacklist，加入 system.children

- [ ] **Step 1: 菜单**

```tsx
{
  path: 'blacklist',
  name: '黑名单管理',
  auth: ['blacklist-management'],
  component: lazy(() => import('@/views/system/blacklist')),
},
```

- [ ] **Step 2: 主页面** — header、Stat、拦截 Switch（localStorage）、添加按钮、SearchForm（keyword/source/status/rangePicker）、Table、Pagination、FormModal
- [ ] **Step 3: 默认筛选** `status: 'active'`
- [ ] **Step 4: 解除** — confirm → status=unblocked；已解除行无操作按钮
- [ ] **Step 5: 添加防重** — 生效中同 IP 拒绝
- [ ] **Step 6: 浏览器打开 `/system/blacklist` 目测验证**

---

## Spec Coverage Checklist

- [x] 系统管理菜单
- [x] mock CRUD + 软解除
- [x] 统计三卡
- [x] 拦截开关 localStorage
- [x] 筛选含默认生效中
- [x] 时长预设+自定义 + 编辑回填规则
- [x] IPv4 only
- [x] 非目标：API/Redis/CIDR 不做
