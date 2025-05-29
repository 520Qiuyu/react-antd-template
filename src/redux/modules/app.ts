import { getTabInfo, setTabInfo } from '@/utils/app';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export const appSlice = createSlice({
  name: 'app',
  initialState: {
    // 标签卡
    tabs: getTabInfo() as ITab[],
  },
  reducers: {
    addTab: (state, action: PayloadAction<ITab>) => {
      const originTab = state.tabs.find((tab) => tab.key === action.payload.key);
      if (originTab) {
        Object.assign(originTab, action.payload);
      } else {
        state.tabs.push(action.payload);
      }
      // 持久化
      setTabInfo(state.tabs);
    },
    removeTab: (state, action) => {
      state.tabs = state.tabs.filter((tab) => tab.key !== action.payload);
      // 持久化
      setTabInfo(state.tabs);
    },
  },
});

export const { addTab, removeTab } = appSlice.actions;

export default appSlice.reducer;

export interface ITab {
  key: string;
  title: string;
  path: string;
  fullPath: string;
}
