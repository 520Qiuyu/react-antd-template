/** 使用手册类型接口 */
export interface ManualItem {
  id: string;
  name: string;
  url: string;
  auths: string[];
}

/** 面包屑数据结构 */
export interface BreadCrumb extends Pick<IMenu, 'name'> {
  key: string;
  path?: string;
}
