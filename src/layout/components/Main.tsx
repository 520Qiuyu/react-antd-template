import { TransitionComponent } from '@/components';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';
import { flattenRoutesList } from '@/router/menu';
import { useAppStore, useUserStore } from '@/store';
import type { ITab } from '@/types/app';
import { msgError } from '@/utils/modal';
import { Spin, Tag } from 'antd';
import classNames from 'classnames';
import type { RefObject } from 'react';
import { Suspense } from 'react';
import { matchPath, Navigate } from 'react-router';
import styles from './index.module.less';

export default function Main() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentRoute = useCurrentRoute();
  const auth = useUserStore((state) => state.auth);
  const tabs = useAppStore((state) => state.tabs);
  const removeTab = useAppStore((state) => state.removeTab);

  // 根据权限过滤出路由
  const authRoutes = useMemo(() => {
    return flattenRoutesList?.filter((route) => {
      if (!route.auth) return true;
      const routeAuth = Array.isArray(route.auth) ? route.auth : [route.auth];
      return routeAuth.some((item) => auth?.includes(item));
    });
  }, [auth]);

  const handleTabClose = (tab: ITab) => {
    /**
     * 1、判断是否可删除（只剩一个不能删）
     * 2、删除对应tab项
     * 3、如果删除的当前激活的项则跳转至相邻tab
     */
    if (!tabs.length || tabs.length <= 1) {
      msgError('至少开启一个tab');
      console.error('至少保留一个tab');
      return;
    }
    const { key } = tab;
    removeTab(key);
    if (currentRoute?.key === key) {
      const index = tabs.findIndex((t) => t.key === currentRoute?.key);
      if (index === -1) return msgError('tab跳转错误，未找到现存的tab');
      else if (index === 0) {
        navigate(tabs[1].path);
      } else {
        navigate(tabs[index - 1].path);
      }
    }
  };
  const isTabCanVisit = (tab: ITab) => {
    const { path } = tab;
    return authRoutes?.find((route) => {
      const match = matchPath(route.path, path);
      return match && route.component;
    });
  };
  const handleTabClick = (tab: ITab) => {
    console.log('tab', tab);
    const { fullPath } = tab;
    if (!isTabCanVisit(tab)) {
      msgError('该页面不可访问！');
      console.error('该路径未配置组件，不可访问！');
      return;
    }
    navigate(fullPath);
  };

  const renderRoutes = useRoutes(
    authRoutes?.map((route) => {
      const { path } = route;
      const Component = route.component;
      return {
        path,
        element: Component ? <Component /> : <Navigate to='/' replace />,
      };
    }),
  );

  return (
    <>
      {/* 窗口标签容器 */}
      {tabs?.length && !currentRoute?.hiddenLayout ? (
        <div className={styles['tabs-wrapper']}>
          {tabs?.map((tab) => {
            const { title, key } = tab;
            return (
              <Tag
                key={key}
                bordered={false}
                closable
                className={classNames(styles['tab-tag'], {
                  [styles['active']]: currentRoute && currentRoute.key === key,
                })}
                color={isTabCanVisit(tab) ? undefined : 'red'}
                onClose={() => handleTabClose(tab)}
                onClick={() => handleTabClick(tab)}>
                {title}
              </Tag>
            );
          })}
        </div>
      ) : null}
      <TransitionComponent>
        {(nodeRef) => (
          <div
            className={classNames(styles['content'], {
              [styles['hidden-layout']]: currentRoute?.hiddenLayout,
            })}
            ref={nodeRef as RefObject<HTMLDivElement>}>
            <Suspense
              fallback={
                <Spin
                  size='large'
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                />
              }>
              {renderRoutes}
            </Suspense>
          </div>
        )}
      </TransitionComponent>
    </>
  );
}
