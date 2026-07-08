/** 权限资源类型 */
export type PermissionResourceType = 'menu' | 'button' | 'api' | 'module';

/** 权限资源请求方法 */
export type PermissionResourceMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

/** 权限角色状态 */
export type PermissionRoleStatus = 'normal' | 'disabled';

/** 权限资源项 */
export interface PermissionResourceItem {
  id: string;
  name: string;
  code: string;
  type: PermissionResourceType;
  parentId?: string | null;
  url?: string | null;
  method?: PermissionResourceMethod | null;
  remark?: string | null;
  ctime: string;
  utime: string;
}

/** 权限资源树返回模式 */
export type PermissionResourceTreeMode = 'full' | 'lazy';

/** 权限资源树查询参数 */
export interface GetPermissionResourceTreeParams {
  mode?: PermissionResourceTreeMode;
  parentId?: string;
}

/** 权限资源树节点 */
export interface PermissionResourceTreeNode extends PermissionResourceItem {
  children?: PermissionResourceTreeNode[];
  hasChildren?: boolean;
}

/** 权限角色项 */
export interface PermissionRoleItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: PermissionRoleStatus;
  remark?: string | null;
  ctime: string;
  utime: string;
}

/** 角色资源关联项 */
export interface PermissionRoleResourceItem {
  id: string;
  roleId: string;
  resourceId: string;
  remark?: string | null;
  ctime: string;
  utime: string;
}

/** 用户角色关联项 */
export interface PermissionUserRoleItem {
  id: string;
  userId: string;
  roleId: string;
  remark?: string | null;
  ctime: string;
  utime: string;
}

/** 分页查询基础参数 */
export interface PaginationQuery {
  pageNum?: number;
  pageSize?: number;
}

/** 权限分页数据（与后端 PaginatedResult 对齐） */
export interface PermissionPageData<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

/** 权限资源列表查询参数 */
export interface ListPermissionResourceParams extends PaginationQuery {
  keyword?: string;
  type?: PermissionResourceType;
  parentId?: string;
}

/** 权限角色列表查询参数 */
export interface ListPermissionRoleParams extends PaginationQuery {
  keyword?: string;
  status?: PermissionRoleStatus;
}

/** 创建权限资源参数 */
export interface CreatePermissionResourceParams {
  name: string;
  code: string;
  type?: PermissionResourceType;
  parentId?: string;
  url?: string;
  method?: PermissionResourceMethod;
  remark?: string;
}

/** 更新权限资源参数 */
export type UpdatePermissionResourceParams = Partial<CreatePermissionResourceParams>;

/** 创建权限角色参数 */
export interface CreatePermissionRoleParams {
  name: string;
  code: string;
  description?: string;
  status?: PermissionRoleStatus;
  remark?: string;
}

/** 更新权限角色参数 */
export type UpdatePermissionRoleParams = Partial<CreatePermissionRoleParams>;

/** 角色资源关联列表查询参数 */
export interface ListPermissionRoleResourceParams extends PaginationQuery {
  roleId?: string;
  resourceId?: string;
}

/** 创建角色资源关联参数 */
export interface CreatePermissionRoleResourceParams {
  roleId: string;
  resourceId: string;
  remark?: string;
}

/** 更新角色资源关联参数 */
export type UpdatePermissionRoleResourceParams = Partial<CreatePermissionRoleResourceParams>;

/** 用户角色关联列表查询参数 */
export interface ListPermissionUserRoleParams extends PaginationQuery {
  userId?: string;
  roleId?: string;
}

/** 创建用户角色关联参数 */
export interface CreatePermissionUserRoleParams {
  userId: string;
  roleId: string;
  remark?: string;
}

/** 更新用户角色关联参数 */
export type UpdatePermissionUserRoleParams = Partial<CreatePermissionUserRoleParams>;

export type PermissionResourceListData = PermissionPageData<PermissionResourceItem>;
export type PermissionRoleListData = PermissionPageData<PermissionRoleItem>;
export type PermissionRoleResourceListData = PermissionPageData<PermissionRoleResourceItem>;
export type PermissionUserRoleListData = PermissionPageData<PermissionUserRoleItem>;
