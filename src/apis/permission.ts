import type {
  CreatePermissionResourceParams,
  CreatePermissionRoleParams,
  CreatePermissionRoleResourceParams,
  CreatePermissionUserRoleParams,
  ListPermissionResourceParams,
  ListPermissionRoleParams,
  ListPermissionRoleResourceParams,
  ListPermissionUserRoleParams,
  PermissionResourceItem,
  PermissionResourceListData,
  PermissionRoleItem,
  PermissionRoleListData,
  PermissionRoleResourceItem,
  PermissionRoleResourceListData,
  PermissionUserRoleItem,
  PermissionUserRoleListData,
  UpdatePermissionResourceParams,
  UpdatePermissionRoleParams,
  UpdatePermissionRoleResourceParams,
  UpdatePermissionUserRoleParams,
} from '@/types/permission';
import { del, get, post, put } from 'utils/request';

/** 获取权限资源列表 */
export const reqListPermissionResources = (params?: ListPermissionResourceParams) =>
  get<PermissionResourceListData, ListPermissionResourceParams>('/permission/resource', params);

/** 获取权限资源详情 */
export const reqGetPermissionResource = (id: string) =>
  get<PermissionResourceItem>(`/permission/resource/${id}`);

/** 创建权限资源 */
export const reqCreatePermissionResource = (data: CreatePermissionResourceParams) =>
  post<PermissionResourceItem, CreatePermissionResourceParams>('/permission/resource', data);

/** 更新权限资源 */
export const reqUpdatePermissionResource = (id: string, data: UpdatePermissionResourceParams) =>
  put<PermissionResourceItem, UpdatePermissionResourceParams>(`/permission/resource/${id}`, data);

/** 删除权限资源 */
export const reqDeletePermissionResource = (id: string) =>
  del<PermissionResourceItem>(`/permission/resource/${id}`);

/** 获取权限角色列表 */
export const reqListPermissionRoles = (params?: ListPermissionRoleParams) =>
  get<PermissionRoleListData, ListPermissionRoleParams>('/permission/role', params);

/** 获取权限角色详情 */
export const reqGetPermissionRole = (id: string) => get<PermissionRoleItem>(`/permission/role/${id}`);

/** 创建权限角色 */
export const reqCreatePermissionRole = (data: CreatePermissionRoleParams) =>
  post<PermissionRoleItem, CreatePermissionRoleParams>('/permission/role', data);

/** 更新权限角色 */
export const reqUpdatePermissionRole = (id: string, data: UpdatePermissionRoleParams) =>
  put<PermissionRoleItem, UpdatePermissionRoleParams>(`/permission/role/${id}`, data);

/** 删除权限角色 */
export const reqDeletePermissionRole = (id: string) =>
  del<PermissionRoleItem>(`/permission/role/${id}`);

/** 获取角色资源关联列表 */
export const reqListPermissionRoleResources = (params?: ListPermissionRoleResourceParams) =>
  get<PermissionRoleResourceListData, ListPermissionRoleResourceParams>(
    '/permission/role-resource',
    params,
  );

/** 获取角色资源关联详情 */
export const reqGetPermissionRoleResource = (id: string) =>
  get<PermissionRoleResourceItem>(`/permission/role-resource/${id}`);

/** 创建角色资源关联 */
export const reqCreatePermissionRoleResource = (data: CreatePermissionRoleResourceParams) =>
  post<PermissionRoleResourceItem, CreatePermissionRoleResourceParams>(
    '/permission/role-resource',
    data,
  );

/** 更新角色资源关联 */
export const reqUpdatePermissionRoleResource = (
  id: string,
  data: UpdatePermissionRoleResourceParams,
) =>
  put<PermissionRoleResourceItem, UpdatePermissionRoleResourceParams>(
    `/permission/role-resource/${id}`,
    data,
  );

/** 删除角色资源关联 */
export const reqDeletePermissionRoleResource = (id: string) =>
  del<PermissionRoleResourceItem>(`/permission/role-resource/${id}`);

/** 获取用户角色关联列表 */
export const reqListPermissionUserRoles = (params?: ListPermissionUserRoleParams) =>
  get<PermissionUserRoleListData, ListPermissionUserRoleParams>('/permission/user-role', params);

/** 获取用户角色关联详情 */
export const reqGetPermissionUserRole = (id: string) =>
  get<PermissionUserRoleItem>(`/permission/user-role/${id}`);

/** 创建用户角色关联 */
export const reqCreatePermissionUserRole = (data: CreatePermissionUserRoleParams) =>
  post<PermissionUserRoleItem, CreatePermissionUserRoleParams>('/permission/user-role', data);

/** 更新用户角色关联 */
export const reqUpdatePermissionUserRole = (id: string, data: UpdatePermissionUserRoleParams) =>
  put<PermissionUserRoleItem, UpdatePermissionUserRoleParams>(`/permission/user-role/${id}`, data);

/** 删除用户角色关联 */
export const reqDeletePermissionUserRole = (id: string) =>
  del<PermissionUserRoleItem>(`/permission/user-role/${id}`);
