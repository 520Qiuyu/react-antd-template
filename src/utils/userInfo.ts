const UserInfoKey = 'userInfo';
const TokenKey = 'access_token';
const StorageType = localStorage;

/** 获取用户登录信息 */
export const getLocalUserInfo = (): UserInfo => {
  return JSON.parse(StorageType.getItem(UserInfoKey) || '{}');
};
/** 设置用户登录信息 */
export const setLocalUserInfo = (userInfo: UserInfo) => {
  console.log('userInfo', userInfo);
  StorageType.setItem(UserInfoKey, JSON.stringify(userInfo));
};
/** 清除用户登录信息 */
export const clearLocalUserInfo = () => {
  StorageType.removeItem(UserInfoKey);
};

/** 登录token */
export const getLocalToken = () => {
  return StorageType.getItem(TokenKey);
};
/** 设置登录token */
export const setLocalToken = (token: string) => {
  StorageType.setItem(TokenKey, token);
};
/** 清除登录token */
export const clearLocalToken = () => {
  StorageType.removeItem(TokenKey);
};

/** 获取用户权限 */
export const getUserPermissions = () => {
  return getLocalUserInfo()?.permissions || [];
};

/** 判断是否拥有权限 */
export function hasAuthority(
  resources: string | string[],
  permissions: UserInfoPermission[] = getUserPermissions(),
) {
  console.log('permissions',permissions)
  const isArray = Array.isArray(resources);
  return (isArray ? resources : [resources]).some((item) => {
    return permissions?.some((permission) => permission.code === item);
  });
}

/** 清除所有用户信息 */
export const clearAllLocalUserInfo = () => {
  clearLocalUserInfo();
  clearLocalToken();
};
