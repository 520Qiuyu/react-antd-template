import { Role } from '@/constants';
import { useUserStore } from '@/store';

let firstLoad = true;

export const useUser = (options?: IOption) => {
  const { autoGetUserInfo = true } = options ?? {};

  /** 用户信息 */
  const userInfo = useUserStore((state) => state.userInfo);
  /** 获取用户信息 */
  const getUserInfo = useUserStore((state) => state.getUserInfo);
  /** 清除用户信息 */
  const clearUser = useUserStore((state) => state.clearUser);
  /** 是否是超级管理员 */
  const isSuperAdmin = userInfo?.roles?.some((role) => role.code === Role.SUPER_ADMIN);
  /** 是否是管理员 */
  const isAdmin = userInfo?.roles?.some((role) => role.code === Role.ADMIN);
  /** 是否是代理 */
  const isProxy = userInfo?.roles?.some((role) => role.code === Role.PROXY);

  /** 是否有权限 */
  const hasPermission = (permissionCode: string | string[]) => {
    if (isSuperAdmin) return true;
    const permissionCodes = Array.isArray(permissionCode) ? permissionCode : [permissionCode];
    return userInfo?.permissions?.some((permission) => permissionCodes.includes(permission.code));
  };

  // 挂载的时候获取用户信息
  useEffect(() => {
    if (firstLoad && autoGetUserInfo) {
      getUserInfo();
      firstLoad = false;
      return;
    }
  }, []);

  return {
    userInfo,
    isSuperAdmin,
    isAdmin,
    isProxy,
    getUserInfo,
    clearUser,
    hasPermission,
  };
};

interface IOption {
  /** 是否自动获取用户信息 */
  autoGetUserInfo?: boolean;
}
