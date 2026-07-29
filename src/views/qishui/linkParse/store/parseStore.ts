import { reqGetCardSecretBySecret } from '@/apis';
import type { CardSecretDetail } from '@/types/cardSecret';
import { create } from 'zustand';
import { mockParseDelay } from '../utils';

export interface TocSection {
  id: string;
  label: string;
}

/** 卡密信息（链接解析侧） */
export type CardSecret = CardSecretDetail;

interface ParseStoreState {
  /** 目录 */
  tocSections: TocSection[];
  /** 卡密信息 */
  cardSecret?: CardSecret;
  /** 侧边栏是否打开（移动端抽屉） */
  sidebarOpen: boolean;
}

interface ParseStoreAction {
  /** 设置目录 */
  setTocSections: (tocSections: TocSection[]) => void;
  /** 设置卡密信息 */
  setCardSecret: (cardSecret?: CardSecret) => void;
  /** 获取卡密信息 */
  getCardSecret: (cardSecret: string) => Promise<CardSecret | undefined>;
  /** 设置侧边栏开关 */
  setSidebarOpen: (sidebarOpen: boolean) => void;
  /** 切换侧边栏开关 */
  toggleSidebarOpen: () => void;
}

type ParseStore = ParseStoreState & ParseStoreAction;

export const useParseStore = create<ParseStore>()((set) => ({
  tocSections: [],
  cardSecret: undefined,
  sidebarOpen: false,
  setTocSections: (tocSections) => set({ tocSections }),
  setCardSecret: (cardSecret) => set({ cardSecret }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebarOpen: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  getCardSecret: async (cardSecret: string) => {
    await mockParseDelay(1);
    const res = await reqGetCardSecretBySecret(cardSecret);
    if (res.code === 200) {
      set({ cardSecret: res.data! });
      return res.data!;
    }
    return undefined;
  },
}));
