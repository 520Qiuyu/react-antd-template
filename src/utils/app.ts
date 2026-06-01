import type { ITab } from '@/types/app';

const StorageType = sessionStorage;
const TabKey = 'tab';

/** 获取tab信息 */
export const getTabInfo = (): ITab[] => {
  const tabInfo = StorageType.getItem(TabKey);
  if (tabInfo) {
    return JSON.parse(tabInfo);
  }
  return [] as ITab[];
};
/** 设置tab信息 */
export const setTabInfo = (tabInfo: ITab[]) => {
  StorageType.setItem(TabKey, JSON.stringify(tabInfo));
};
/** 清除tab信息 */
export const clearTabInfo = () => {
  StorageType.removeItem(TabKey);
};
