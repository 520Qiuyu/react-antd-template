import { flatten, formatter } from 'utils/menuUtils';

const isDev = import.meta.env.MODE === 'development';

// 此处配置的是layout中的路由 非layout中的路由请前往App.tsx中配置
export const routes: IMenu[] = [
  // 汽水音乐// 数据看板（一期假数据预览；权限资源后续再挂）
  {
    path: 'data-dashboard',
    name: '数据看板',
    icon: 'charts-bar',
    auth: ['data-dashboard'],
    component: lazy(() => import('@/views/dataDashboard')),
  },
  {
    path: 'card-secret',
    name: '卡密管理',
    icon: 'lock',
    auth: ['card-secret-management'],
    component: lazy(() => import('@/views/cardSecret')),
  },
  // 快速创建卡密
  {
    path: 'quick-create-card',
    name: '快速创建卡密',
    auth: ['card-secret-management'],
    component: lazy(() => import('@/views/quickCreateCard')),
    hiddenLayout: true,
    hidden: true,
  },
  {
    path: 'auth-info',
    name: '认证信息管理',
    icon: 'customer-certified',
    component: lazy(() => import('@/views/authInfo')),
  },
  {
    path: 'logs',
    name: '日志管理',
    icon: 'time-history',
    auth: ['qishui-logs-management'],
    component: lazy(() => import('@/views/parseLogs')),
  },
  {
    path: 'qishui',
    name: '汽水音乐',
    icon: 'listening-fill',
    hidden: true,
    children: [
      // 快速创建卡密
      {
        path: 'quick-create-card',
        name: '快速创建卡密',
        auth: ['card-secret-management'],
        component: lazy(() => import('@/views/quickCreateCard')),
        hiddenLayout: true,
        hidden: true,
      },
      {
        path: 'auth-info',
        name: '认证信息管理',
        component: lazy(() => import('@/views/authInfo')),
      },
      {
        path: 'link-parse',
        name: '链接解析',
        component: lazy(() => import('@/views/qishui/linkParse')),
        hiddenLayout: true,
      },
    ],
  },
  // 音乐解析
  {
    path: 'music-parse',
    name: '音乐解析',
    icon: 'listening-fill',
    children: [
      // 汽水音乐解析
      {
        path: 'qishui-music-parse',
        name: '汽水音乐解析',
        component: lazy(() => import('@/views/qishui/linkParse')),
        hiddenLayout: true,
      },
      // 网易云音乐解析
      {
        path: 'netease-music-parse',
        name: '网易云音乐解析',
        component: lazy(() => import('@/views/neteaseMusic/parse')),
        hiddenLayout: true,
      },
    ],
  },
  // 系统管理
  {
    path: 'system',
    name: '系统管理',
    auth: ['system-management'],
    icon: 'settings',
    children: [
      {
        path: 'user',
        name: '用户管理',
        auth: ['user-management'],
        component: lazy(() => import('@/views/system/user')),
      },
      {
        path: 'role',
        name: '角色管理',
        auth: ['role-management'],
        component: lazy(() => import('@/views/system/role')),
      },
      {
        path: 'resource',
        name: '资源管理',
        auth: ['resource-management'],
        component: lazy(() => import('@/views/system/resource')),
      },
      // 黑名单管理
      {
        path: 'blacklist',
        name: '黑名单管理',
        auth: ['blacklist-management'],
        component: lazy(() => import('@/views/system/blacklist')),
      },
    ],
  },
  // 登录
  {
    path: 'login',
    name: '登录',
    icon: 'customer-group',
    component: lazy(() => import('@/views/login')),
    hiddenLayout: true,
    hiddenBreadcrumb: true,
    hidden: true,
  },
  // 401
  {
    path: '401',
    name: '401',
    icon: 'customer-group',
    hidden: true,
    hiddenBreadcrumb: true,
    component: lazy(() => import('@/views/401')),
  },
  // 404
  {
    path: '404',
    name: '404',
    icon: 'customer-group',
    hidden: true,
    hiddenBreadcrumb: true,
    component: lazy(() => import('@/views/404')),
  },
];

isDev &&
  routes.push(
    ...[
      {
        path: 'temp',
        name: 'TEMP(打包自动消失)',
        icon: 'customer-group',
        children: [
          // 测试myModal
          {
            path: 'test-modal',
            name: 'Soda解密测试',
            component: lazy(() => import('@/views/test/testModal')),
          },
          {
            path: 'test-ffmpeg',
            name: 'FFmpeg元信息测试',
            component: lazy(() => import('@/views/test/testFfmpeg')),
          },
        ],
      },
    ],
  );

/** 获取格式化后的菜单 */
export const getRoutesList = (parentPath?: string) => formatter(routes, parentPath);
/** 格式化后的菜单 */
export const formatRoutesList = getRoutesList();
// console.log('formatRoutesList', formatRoutesList);
// @ts-ignore /** 格式化菜单打平 */
export const flattenRoutesList = flatten<IFormatMenu>(formatRoutesList);
// console.log('flattenRoutesList', flattenRoutesList);
