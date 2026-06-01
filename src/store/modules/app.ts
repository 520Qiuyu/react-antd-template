import type { ITab } from '@/types/app';
import { clearTabInfo, getTabInfo, setTabInfo } from '@/utils/app';
import { create } from 'zustand';

interface AppStoreState {
  tabs: ITab[];
  addTab: (tab: ITab) => void;
  removeTab: (key: string) => void;
  clearTabs: () => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  // 标签卡
  tabs: getTabInfo(),
  addTab: (tab) => {
    set((state) => {
      const isExist = state.tabs.some((item) => item.key === tab.key);
      const tabs = isExist
        ? state.tabs.map((item) => (item.key === tab.key ? { ...item, ...tab } : item))
        : [...state.tabs, tab];

      setTabInfo(tabs);
      return { tabs };
    });
  },
  removeTab: (key) => {
    set((state) => {
      const tabs = state.tabs.filter((tab) => tab.key !== key);

      setTabInfo(tabs);
      return { tabs };
    });
  },
  clearTabs: () => {
    clearTabInfo();
    set({ tabs: [] });
  },
}));
