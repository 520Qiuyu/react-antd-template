/** 是否是开发环境 */
export const isDev = import.meta.env.DEV;

/** 数组分组器 */
export const groupBy = <T>(array: T[], key: keyof T) => {
  return array.reduce(
    (acc, item) => {
      const value = item[key] as string;
      acc[value] = acc[value] || [];
      acc[value].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
};

export const getOptions = <T>(array: T[], key: keyof T) => {
  return [...new Set(array.map((item) => item[key] as string))].map((value) => ({
    label: value,
    value,
  }));
};
