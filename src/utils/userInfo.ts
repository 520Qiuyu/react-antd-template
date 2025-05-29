const UserInfoKey = 'userInfo';
const TokenKey = 'access_token';
const AuthorityKey = 'authority';
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

/** 获取权限标识符 */
export function getLocalAuthority() {
  return JSON.parse(StorageType.getItem(AuthorityKey) || '[]');
}
/** 设置权限标识符 */
export function setLocalAuthority(authority: string[]) {
  return StorageType.setItem(AuthorityKey, JSON.stringify(authority));
}
/** 清除权限标识符 */
export function clearLocalAuthority() {
  return StorageType.removeItem(AuthorityKey);
}
/** 判断是否拥有权限 */
export function hasAuthority(resources: string | string[]) {
  const isArray = Array.isArray(resources);
  return (isArray ? resources : [resources]).some((item) => {
    return getLocalAuthority().includes(item);
  });
}

/** 清除所有用户信息 */
export const clearAllLocalUserInfo = () => {
  clearLocalUserInfo();
  clearLocalToken();
  clearLocalAuthority();
};

/** 是否是培养单位 */
export function isTrainUnit() {
  return hasAuthority(['xsgz_yxfsj', 'xsgz_fdy']);
}
/** 是否是学工部 */
export function isXg() {
  return hasAuthority('xsgz_school_work_department');
}
