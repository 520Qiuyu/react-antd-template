/** 后端网关返回数据 */
export interface IApiResponse<T = any> {
  status: number;
  response: T;
  data: T;
}

/** 分页数据 */
export interface IPageData<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  pageCount: number;
  list: T[];
}
