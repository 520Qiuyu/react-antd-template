/** 函数默认值 */
export const NOOP = () => {};

/** 数据状态 */
export const Status: Record<string, UserStatus> = {
  NORMAL: 'normal',
  DISABLED: 'disabled',
  DELETED: 'deleted',
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
