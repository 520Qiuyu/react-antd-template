import type { PermissionResourceType } from '@/types/permission';

export const RESOURCE_TYPE_OPTIONS = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
  { label: '接口', value: 'api' },
  { label: '模块', value: 'module' },
];

export const RESOURCE_TYPE_MAP: Record<PermissionResourceType, { label: string; color: string }> = {
  menu: { label: '菜单', color: 'blue' },
  button: { label: '按钮', color: 'purple' },
  api: { label: '接口', color: 'cyan' },
  module: { label: '模块', color: 'green' },
};

export type ResourceViewMode = 'list' | 'tree';

export const RESOURCE_VIEW_OPTIONS: { label: string; value: ResourceViewMode }[] = [
  { label: '列表模式', value: 'list' },
  { label: '树模式', value: 'tree' },
];
