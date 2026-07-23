import type {
  CreatePermissionResourceParams,
  CreatePermissionRoleParams,
  CreatePermissionRoleResourceParams,
  CreatePermissionUserRoleParams,
  GetPermissionResourceTreeParams,
  ImportPermissionResourceItem,
  ImportPermissionRoleItem,
  ListPermissionResourceParams,
  ListPermissionRoleParams,
  ListPermissionRoleResourceParams,
  ListPermissionUserRoleParams,
  PermissionResourceItem,
  PermissionResourceListData,
  PermissionResourceTreeNode,
  PermissionRoleItem,
  PermissionRoleListData,
  PermissionRoleResourceItem,
  PermissionRoleResourceListData,
  PermissionUserRoleItem,
  PermissionUserRoleListData,
  SyncPermissionRoleResourcesParams,
  SyncPermissionRoleResourcesResult,
  UpdatePermissionResourceParams,
  UpdatePermissionRoleParams,
  UpdatePermissionRoleResourceParams,
  UpdatePermissionUserRoleParams,
} from '@/types/permission';
import type { BatchImportResult, IApiResponse } from '@/types/request';
import { del, get, post, put } from 'utils/request';

const MAX_PAGE_SIZE = 100;

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

/** 批量导入权限资源 */
export const reqImportPermissionResources = (list: ImportPermissionResourceItem[]) =>
  post<BatchImportResult, { list: ImportPermissionResourceItem[] }>(
    '/permission/resource/import/batch',
    { list },
  );

/** 获取权限资源树 */
export const reqGetPermissionResourceTree = (params?: GetPermissionResourceTreeParams) =>
  get<PermissionResourceTreeNode[], GetPermissionResourceTreeParams>(
    '/permission/resource/tree',
    params,
  );

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

/** 批量导入权限角色 */
export const reqImportPermissionRoles = (list: ImportPermissionRoleItem[]) =>
  post<BatchImportResult, { list: ImportPermissionRoleItem[] }>(
    '/permission/role/import/batch',
    { list },
  );

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

/** 获取用户全部角色关联（自动翻页） */
export const reqListAllPermissionUserRoles = async (userId: string) => {
  const all: PermissionUserRoleItem[] = [];
  let pageNum = 1;

  while (true) {
    const res = await reqListPermissionUserRoles({
      userId,
      pageNum,
      pageSize: MAX_PAGE_SIZE,
    });
    if (res.code !== 200) {
      throw new Error(res.message);
    }

    const list = res.data?.list ?? [];
    all.push(...list);

    const total = res.data?.total ?? 0;
    if (all.length >= total || list.length === 0) {
      break;
    }
    pageNum += 1;
  }

  return all;
};

/** 同步用户角色授权（对比 diff 后批量创建/删除） */
export const reqSyncPermissionUserRoles = async (
  userId: string,
  roleIds: string[],
): Promise<IApiResponse> => {
  const existing = await reqListAllPermissionUserRoles(userId);
  const existingRoleIdSet = new Set(existing.map((item) => item.roleId));
  const targetRoleIdSet = new Set(roleIds);

  const toCreate = roleIds.filter((roleId) => !existingRoleIdSet.has(roleId));
  const toDelete = existing.filter((item) => !targetRoleIdSet.has(item.roleId));

  const results = await Promise.all([
    ...toCreate.map((roleId) => reqCreatePermissionUserRole({ userId, roleId })),
    ...toDelete.map((item) => reqDeletePermissionUserRole(item.id)),
  ]);

  const failed = results.find((res) => res.code !== 200);
  if (failed) {
    return failed;
  }

  return {
    code: 200,
    data: null,
    message: 'success',
  };
};

/** 获取角色全部资源关联（自动翻页） */
export const reqListAllPermissionRoleResources = async (roleId: string) => {
  const all: PermissionRoleResourceItem[] = [];
  let pageNum = 1;

  while (true) {
    const res = await reqListPermissionRoleResources({
      roleId,
      pageNum,
      pageSize: MAX_PAGE_SIZE,
    });
    if (res.code !== 200) {
      throw new Error(res.message);
    }

    const list = res.data?.list ?? [];
    all.push(...list);

    const total = res.data?.total ?? 0;
    if (all.length >= total || list.length === 0) {
      break;
    }
    pageNum += 1;
  }

  return all;
};

/** 同步角色资源授权（一次请求完成增删） */
export const reqSyncPermissionRoleResources = (
  roleId: string,
  resourceIds: string[],
) =>
  post<SyncPermissionRoleResourcesResult, SyncPermissionRoleResourcesParams>(
    '/permission/role-resource/sync',
    { roleId, resourceIds },
  );

/** 获取角色全部成员关联（自动翻页） */
export const reqListAllPermissionUserRolesByRole = async (roleId: string) => {
  const all: PermissionUserRoleItem[] = [];
  let pageNum = 1;

  while (true) {
    const res = await reqListPermissionUserRoles({
      roleId,
      pageNum,
      pageSize: MAX_PAGE_SIZE,
    });
    if (res.code !== 200) {
      throw new Error(res.message);
    }

    const list = res.data?.list ?? [];
    all.push(...list);

    const total = res.data?.total ?? 0;
    if (all.length >= total || list.length === 0) {
      break;
    }
    pageNum += 1;
  }

  return all;
};

/** 同步角色成员（对比 diff 后批量创建/删除） */
export const reqSyncPermissionRoleMembers = async (
  roleId: string,
  userIds: string[],
): Promise<IApiResponse> => {
  const existing = await reqListAllPermissionUserRolesByRole(roleId);
  const existingUserIdSet = new Set(existing.map((item) => item.userId));
  const targetUserIdSet = new Set(userIds);

  const toCreate = userIds.filter((userId) => !existingUserIdSet.has(userId));
  const toDelete = existing.filter((item) => !targetUserIdSet.has(item.userId));

  const results = await Promise.all([
    ...toCreate.map((userId) => reqCreatePermissionUserRole({ userId, roleId })),
    ...toDelete.map((item) => reqDeletePermissionUserRole(item.id)),
  ]);

  const failed = results.find((res) => res.code !== 200);
  if (failed) {
    return failed;
  }

  return {
    code: 200,
    data: null,
    message: 'success',
  };
};
