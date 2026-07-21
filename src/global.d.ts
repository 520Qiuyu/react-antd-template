declare module '*.less' {
  const content: { [className: string]: string };
  export default content;
}
declare module '*.png' {
  const content: string;
  export default content;
}
declare module '*.jpg' {
  const content: string;
  export default content;
}
declare module '*.jpeg' {
  const content: string;
  export default content;
}

// window上添加全局属性 baseUrl，casLogoutUrl，casLoginUrl，casStatus
interface Window {
  baseUrl: string;
  casLogoutUrl: string;
  casLoginUrl: string;
  casStatus: boolean;
  reloadAuthorized: () => void;
}

interface Config {
  baseUrl: string;
  title: string;
  menuTitle: string;
  login: string;
}

type UserStatus = 'normal' | 'disabled';
type UserGender = 'male' | 'female' | 'unknown';

interface UserInfoBase {
  /** 用户唯一标识，用于登录态判断、接口请求头等场景 */
  id: string;
  /** 登录账号 */
  account: string;
  /** 用户昵称 */
  nickname?: string;
  /** 用户头像 */
  avatar?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 微信号 */
  wechat?: string;
  /** QQ 号 */
  qq?: string;
  /** 性别 */
  gender?: UserGender;
  /** 生日 */
  birthday?: string | Date;
  /** 账号状态 */
  status: UserStatus;
}

type UserInfo = InterfaceToUndefinedNull<UserInfoBase>;

interface IMenu {
  /** 路径 */
  path: string;
  /** 菜单名称 */
  name: string;
  /** 菜单图标 https://www.iconfont.cn/collections/detail?cid=19238*/
  icon?: string | React.ReactNode;
  /** 组件 */
  component?: React.ComponentType;
  /** 权限资源码 */
  auth?: string | string[];
  /** 是否从菜单栏中隐藏 */
  hidden?: boolean;
  /** 是否隐藏面包屑 */
  hiddenBreadcrumb?: boolean;
  /** 面包屑名字 */
  breadcrumbName?: string;
  /** 是否使用自定义面包屑 设置为true之后，只需在url上传入query参数 ?customBreadcrumbKey=xxx */
  customBreadcrumb?: boolean;
  /** 自定义面包屑的键 */
  customBreadcrumbKey?: string;
  /** 子菜单 */
  children?: IMenu[];
  /** 剔除参数之后的路径 /a/b/:param/c => /a/b/c */
  key?: string;
  /** 是否隐藏layout 隐藏外面的框架 */
  hiddenLayout?: boolean;
}

interface IFormatMenu extends IMenu {
  key: string;
  parentKey: string;
  parentPath: string;
  children?: IFormatMenu[] | IMenu[];
  [key: string]: any;
}

// 阻止ts对自定义属性报错
namespace React {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined; // 允许所有以 '--' 开头的 CSS 属性
  }
}

type SortOrder = 'ascend' | 'descend';

// 页码查询参数
interface PaginationParams {
  pageNum: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: SortOrder;
}

// 页码查询参数
interface PaginationData<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}
