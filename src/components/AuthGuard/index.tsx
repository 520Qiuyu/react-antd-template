import { reqGetAuthList, reqGetLogin } from '@/apis';
import { useAppDispatch, useSearchParams } from '@/hooks';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';
import { addTab } from '@/redux/modules/app';
import { setAuth as setAuthAction, setUserInfo as setUserInfoAction } from '@/redux/modules/user';
import store from '@/redux/store';
import { goToLogin } from '@/utils/casLogin';
import { hasAuthority, setLocalAuthority, setLocalToken, setLocalUserInfo } from '@/utils/userInfo';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const currentRoute = useCurrentRoute();
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const { searchParams, setSearchParams } = useSearchParams();
  const { indexName } = currentRoute || {};
  const isHashRouter = window.location.hash !== '';

  // 设置title
  useTitle(indexName?.join(' | ') || '');

  // 获取权限信息
  const getAuthInfo = async () => {
    try {
      const res = await reqGetAuthList();
      const { meta, data } = res || {};
      if (meta?.success) {
        store.dispatch(setAuthAction(data));
        setLocalAuthority(data);
      } else {
        goToLogin();
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  // 获取用户信息
  const getUserInfo = async (ticket: string) => {
    try {
      if (!ticket) {
        return;
      }
      const location = window.location;
      const res = await reqGetLogin({
        realm: 'sysuRealm',
        ticket,
        service: location.origin + location.pathname + location.hash,
      });
      const { meta } = res || {};
      if (meta?.success) {
        dispatch(setUserInfoAction(res.data));
        setLocalUserInfo(res.data);
        setLocalToken(res.data.accessToken);
        getAuthInfo();
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  // 获取用户信息 从cas跳转回来会重新加载页面，只需要挂载的时候获取一次
  useEffect(() => {
    // 登录后返回到当前页面会携带此参数 默认history路由
    let ticket = searchParams.ticket;
    setSearchParams((sp) => ({
      ...sp,
      ticket: undefined,
    }));
    if (isHashRouter) {
      const location = window.location;
      // 在hash路由模式下，从URL中解析ticket参数
      const urlParams = new URLSearchParams(location.search);
      ticket = urlParams.get('ticket');
      // 清除URL中的ticket参数
      if (ticket) {
        const newUrl = location.origin + '/' + location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    // 只在有ticket参数时获取用户信息
    if (ticket) {
      getUserInfo(ticket);
    } else {
      // 没有ticket时只获取权限信息
      getAuthInfo();
    }
  }, []);

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
      dispatch(
        addTab({
          key: currentRoute!.key,
          path: currentRoute!.path,
          title: currentRoute!.name,
          fullPath: currentRoute!.fullPath!,
        }),
      );
    }
  }, [currentRoute]);

  return <>{children}</>;
};

export default AuthGuard;
