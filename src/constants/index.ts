/** 函数默认值 */
export const NOOP = () => {};

/** 数据状态 */
export const Status: Record<string, UserStatus> = {
  NORMAL: 'normal',
  DISABLED: 'disabled',
  DELETED: 'deleted',
};

/** 性别 */
export const Gender: Record<string, UserGender> = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown',
};
