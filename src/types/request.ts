/** 后端网关返回数据 */
export interface IApiResponse<T = any> {
  code: number;
  data: T | null;
  message: string;
  meta?: {
    message: string;
    statusCode: number;
    success: boolean;
  };
}

/** 分页数据 */
export interface IPageData<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  list: T[];
}

/** 批量导入失败项 */
export interface BatchImportFailedItem {
  index: number;
  message: string;
  data?: unknown;
}

/** 批量导入结果 */
export interface BatchImportResult {
  success: number;
  failed: number;
  failedItems: BatchImportFailedItem[];
}
