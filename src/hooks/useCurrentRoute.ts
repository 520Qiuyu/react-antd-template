import { flattenRoutesList } from '@/router/menu';
import { generatePath, matchPath } from 'react-router';

export const useCurrentRoute = () => {
  const { pathname, search } = useLocation();
  const [routeInfo, setRouteInfo] = useState<IRouterInfo | undefined>(getCurrentRoute());
  /** 通过key找route */
  function getParentRouteByKey(key: string) {
    const route = flattenRoutesList.find((i) => i.key === key);
    if (route) {
      return route;
    }
    return null;
  }
  /** 解析当前路由 */
  function getCurrentRoute() {
    for (const item of flattenRoutesList) {
      const match = matchPath(item.path, pathname);
      if (match) {
        const routeInfo: IRouterInfo = {
          ...item,
          indexPath: [item.path],
          indexKey: [item.key],
          indexName: [item.name],
          fullPath: pathname + search,
        };
        let curItem = item;
        while (curItem?.parentKey) {
          const parentRoute = getParentRouteByKey(curItem.parentKey);
          if (!parentRoute) break;
          routeInfo.parentRoute = parentRoute;
          routeInfo.indexPath?.unshift(parentRoute.path);
          routeInfo.indexKey?.unshift(parentRoute.key);
          routeInfo.indexName?.unshift(parentRoute.name);
          curItem = parentRoute!;
        }
        return routeInfo;
      }
    }
  }

  useEffect(() => {
    setRouteInfo(getCurrentRoute());
  }, [pathname, search]);

  return routeInfo;
};

export interface IRouterInfo extends IFormatMenu {
  /** 父路由 没有时为null*/
  parentRoute?: IFormatMenu | null;
  /** 索引路径 匹配模式（带参数） ['/test/', '/test/testChild', '/test/testChild/testDetail/:id?'] */
  indexPath?: string[];
  /** 索引key 无参数  ['/test', '/test/testChild', '/test/testChild/testDetail'] */
  indexKey?: string[];
  /** 索引名字 ['测试', '测试子路由', '测试详情页'] */
  indexName?: string[];
  /** 完整路径 带实际参数/test/testChild/testDetail/999  */
  fullPath?: string;
}
