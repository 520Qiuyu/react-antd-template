import type { RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';
import { flattenRoutesList } from './menu';

// 路由配置
const routes: RouteObject[] = flattenRoutesList?.map((route) => {
  const Component = route.component!;
  return {
    path: route.path,
    element: <Component />,
  };
});

console.log('routes', routes);

export default createBrowserRouter(routes);
