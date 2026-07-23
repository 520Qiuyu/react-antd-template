/** 函数默认值 */
export const NOOP = () => {};

/** 数据状态 */
export const Status: Record<string, UserStatus> = {
  NORMAL: 'normal',
  DISABLED: 'disabled',
};
export const STATUS_OPTIONS = [
  { label: '正常', value: Status.NORMAL },
  { label: '禁用', value: Status.DISABLED },
];

/** 性别 */
export const Gender: Record<string, UserGender> = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown',
};
export const GENDER_OPTIONS = [
  { label: '男', value: Gender.MALE },
  { label: '女', value: Gender.FEMALE },
  { label: '未知', value: Gender.UNKNOWN },
];

/** 用户角色 */
type UserRole = 'super_admin' | 'admin' | 'proxy';
/** 角色 */
export const Role: Record<string, UserRole> = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROXY: 'proxy',
};
export const ROLE_OPTIONS = [
  { label: '超级管理员', value: Role.SUPER_ADMIN },
  { label: '管理员', value: Role.ADMIN },
  { label: '代理', value: Role.PROXY },
];
