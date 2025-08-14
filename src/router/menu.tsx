import { flatten, formatter } from 'utils/menuUtils';

const isDev = import.meta.env.MODE === 'development';

// 此处配置的是layout中的路由 非layout中的路由请前往App.tsx中配置
export const routes: IMenu[] = [
  // qq音乐
  {
    path: 'qq-music',
    name: 'qq音乐',
    icon: 'customer-group',
    children: [
      // 歌手查询
      {
        path: 'singer',
        name: '歌手查询',
        icon: 'customer-group',
        component: lazy(() => import('@/views/singer')),
      },
      // 歌手首页
      {
        path: 'singer-home/:mid',
        name: '歌手首页',
        icon: 'customer-group',
        component: lazy(() => import('@/views/singerHome')),
        hidden: true,
      },
      // 歌单查询
      {
        path: 'songList',
        name: '歌单查询',
        icon: 'customer-group',
        component: lazy(() => import('@/views/songList')),
      },
    ],
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
