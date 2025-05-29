/**
 * 服务统一配置参数
 * @baseUrl 当前前端服务对应后端服务的前缀名
 * @title 当前网页的标题名称
 */
export const config: Config = {
  baseUrl: 'api/sm-basic',
  title: 'basic系统',
  menuTitle: 'basic系统',
  login: '/login',
  manulModule: 'test',
  // 是否开启cas登录
  casLogin: true,
};
