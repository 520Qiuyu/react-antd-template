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

interface UserInfo {
  accessToken: string;
  apps: Record<string, unknown>; // 如果 apps 可以包含任意键值对
  attributes: string;
  authorization: Record<string, string>;
  departmentId: string;
  departmentName: string;
  email: string;
  expiresIn: number;
  firstLogin: boolean;
  headPortrait: string;
  id: string;
  menus: Record<string, unknown>; // 如果 menus 可以包含任意键值对
  nickName: string;
  orderNumber: string;
  orgId: string;
  phone: string;
  qq: string;
  refreshToken: string;
  sessionId: string;
  sex: string;
  skin: string;
  status: string;
  userId: string;
  userName: string;
  userType: string;
}

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
