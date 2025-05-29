# 运营管理系统前端

基于 React + TypeScript + Vite 构建的运营管理系统前端项目。

## 开发环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0

推荐使用 [Volta](https://docs.volta.sh/guide/getting-started) 来管理 Node.js 版本。

### Volta 安装

**Windows 安装**

使用 winget 安装（推荐）：

```bash
winget install Volta.Volta
```

**Unix 系统安装（包括 macOS）**

使用以下命令安装：

```bash
curl https://get.volta.sh | bash
```

### 使用 Volta 管理 Node.js

安装指定版本的 Node.js：

```bash
volta install node@20.0.0
```

### 固定项目的 Node.js 和包管理器版本

使用 `volta pin` 命令为项目固定 Node.js 和包管理器版本：

```bash
# 固定 Node.js 版本
volta pin node@20.0.0

# 固定包管理器版本
volta pin yarn@1.19
```

## 项目启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
# 或者使用
pnpm start

# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 生成导出文件
pnpm generate-exports
```

## 项目结构

项目采用模块化的目录结构，每个目录都有其特定的职责：

```
src/
├── apis/          # API 接口定义
│   ├── index.ts   # API 接口统一导出
│   └── *.ts       # 按功能模块划分的接口文件
│
├── assets/        # 静态资源文件
│   ├── fonts/     # 字体文件
│   ├── images/    # 图片资源
│   └── styles/    # 全局样式文件
│
├── components/    # 公共组件
│   ├── AuthGuard/     # 权限控制组件
│   ├── Loading/       # 加载状态组件
│   ├── MyIcon/        # 图标组件
│   └── TransitionComponent/  # 过渡动画组件
│
├── config/        # 项目配置
│   ├── index.ts   # 全局配置导出
│   └── theme.ts   # 主题相关配置
│
├── constants/     # 常量定义
│   └── index.ts   # 全局常量
│
├── hooks/         # 自定义 Hooks
│   ├── useAutoScroll.ts    # 自动滚动
│   ├── useClickOutside.ts  # 点击外部区域
│   ├── useCurrentRoute.ts  # 路由相关
│   ├── useGetList.ts       # 列表数据获取
│   └── useVisible.ts       # 显示状态管理
│
├── layout/        # 布局组件
│   ├── components/  # 布局相关子组件
│   └── hooks/       # 布局相关钩子
│
├── redux/         # 状态管理
│   ├── modules/   # 按功能模块划分的状态
│   ├── store.ts   # Redux store配置
│   └── index.tsx  # Redux入口文件
│
├── router/        # 路由配置
│   ├── index.tsx  # 路由主配置 废弃不用
│   └── menu.tsx   # 菜单配置
│
├── types/         # TypeScript 类型定义
│   ├── app.ts     # 应用级类型
│   ├── request.ts # 请求相关类型
│   └── utils.d.ts # 工具类型声明
│
├── utils/         # 工具函数
│   ├── app.ts     # 应用工具函数
│   ├── request.ts # 请求封装
│   ├── check.ts   # 校验工具
│   └── modal/     # 弹窗工具
│
└── views/         # 页面组件
    ├── home/      # 首页
    ├── login/     # 登录页
    ├── 401/       # 无权限页面
    └── 404/       # 未找到页面
```

### 目录职责说明

- **apis**: 集中管理所有后端API接口，按功能模块划分，便于维护和复用
- **assets**: 存放项目所需的静态资源，包括字体、图片和全局样式
- **components**: 可复用的UI组件，包含权限控制、加载状态等基础组件
- **config**: 项目配置文件，包括主题配置等全局设置
- **constants**: 定义全局使用的常量，避免魔法数字和字符串
- **hooks**: 封装常用的业务逻辑，提供可复用的状态和行为
- **layout**: 页面布局相关组件，处理整体页面结构
- **redux**: 全局状态管理，按功能模块划分不同的状态切片
- **router**: 路由配置，包括路由守卫和菜单配置
- **types**: TypeScript类型定义，确保代码类型安全
- **utils**: 通用工具函数，包括请求封装、校验等
- **views**: 页面级组件，按功能模块组织的具体页面实现

## 主要功能

- 基于 React 19 + TypeScript 5.8 开发
- 使用 Vite 6 作为构建工具，支持快速的开发体验
- 集成 ESLint 9 + Prettier 3 代码规范
- 使用 Redux Toolkit 进行状态管理
- 支持路由鉴权和权限控制（基于 React Router 7）
- 封装通用的 API 请求处理（基于 Axios 1.9）
- 提供丰富的自定义 Hooks（集成 ahooks 3.8）

## 环境变量配置

项目包含两个环境配置文件：

- `.env.development`: 开发环境配置
- `.env.production`: 生产环境配置

## 代码规范

项目使用 ESLint 进行代码检查，配置文件为 `eslint.config.js`。主要规则包括：

- TypeScript 语法检查
- React Hooks 规则检查
- React 组件刷新检查

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88
