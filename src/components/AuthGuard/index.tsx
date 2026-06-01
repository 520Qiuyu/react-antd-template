import { useCurrentRoute } from '@/hooks/useCurrentRoute';
import { useAppStore } from '@/store';
import { hasAuthority } from '@/utils/userInfo';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const currentRoute = useCurrentRoute();
  const addTab = useAppStore((state) => state.addTab);
  const { pathname } = useLocation();
  const { indexName } = currentRoute || {};

  // 设置title
  useTitle(indexName?.join(' | ') || '');

  // 重定向
  useEffect(() => {
    // 这种情况下可能会获取不到当前路由，但是他会自动跳转到第一个可用路由，所以不需要做处理
    if (['', '/', '/login'].includes(pathname)) {
      return;
    }

    // 没有当前路由信息 404
    if (!currentRoute) {
      console.log('路由跳转404，由AuthGard跳转。');
      navigate('/404', { replace: true });
      return;
    }

    // 有当前路由信息 但是没有权限 403
    if (currentRoute.auth && hasAuthority(currentRoute.auth)) {
      console.log('路由跳转403，由AuthGard跳转。');
      navigate('/403', { replace: true });
      return;
    }

    if (!currentRoute.hiddenBreadcrumb) {
      addTab({
        key: currentRoute!.key,
        path: currentRoute!.path,
        title: currentRoute!.name,
        fullPath: currentRoute!.fullPath!,
      });
    }
  }, [currentRoute]);

  return <>{children}</>;
};

export default AuthGuard;
