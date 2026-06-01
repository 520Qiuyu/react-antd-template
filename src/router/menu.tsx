import { flatten, formatter } from 'utils/menuUtils';

const isDev = import.meta.env.MODE === 'development';

// 此处配置的是layout中的路由 非layout中的路由请前往App.tsx中配置
export const routes: IMenu[] = [
  // 流程服务
  {
    path: 'process',
    name: '流程服务',
    icon: 'connections',
    children: [
      {
        path: 'management',
        name: '流程管理',
        component: lazy(() => import('@/views/process/management')),
      },
      {
        path: 'instance',
        name: '实例管理',
        component: lazy(() => import('@/views/process/instance')),
      },
      {
        path: 'evaluation',
        name: '评价管理',
        component: lazy(() => import('@/views/process/evaluation')),
      },
      {
        path: 'change-record',
        name: '变更记录',
        component: lazy(() => import('@/views/process/change-record')),
      },
      {
        path: 'process-handle',
        name: '流程预处理',
        component: lazy(() => import('@/views/process/process-handle')),
      },
    ],
  },
  // 数据分析
  {
    path: 'data-analysis',
    name: '数据分析',
    icon: 'charts-line',
    children: [],
  },
  // 权限管理
  {
    path: 'permission',
    name: '权限管理',
    icon: 'name-card',
    children: [],
  },
  // 系统管理
  {
    path: 'system',
    name: '系统管理',
    icon: 'settings',
    children: [],
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
            name: '测试myModal',
            component: lazy(() => import('@/views/test/testModal')),
          },
        ],
      },
    ],
  );

/** 获取格式化后的菜单 */
export const getRoutesList = (parentPath?: string) => formatter(routes, parentPath);
/** 格式化后的菜单 */
export const formatRoutesList = getRoutesList();
console.log('formatRoutesList', formatRoutesList);
// @ts-ignore /** 格式化菜单打平 */
export const flattenRoutesList = flatten<IFormatMenu>(formatRoutesList);
console.log('flattenRoutesList', flattenRoutesList);
