import { get, post } from 'utils/request';
export const base = window.baseUrl;
// 公共接口
export const reqGetLogout = () => get(`/logout`);

export const reqGetLogin = (p) =>
  post(`/sso/login`, {}, p, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

// get api/sm-sso/authority/users/current 获取权限资源
export const reqGetAuthList = () => get(`/api/sm-sso/authority/users/current`);
