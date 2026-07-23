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
}

interface ParseStoreAction {
  /** 设置目录 */
  setTocSections: (tocSections: TocSection[]) => void;
  /** 设置卡密信息 */
  setCardSecret: (cardSecret?: CardSecret) => void;
  /** 获取卡密信息 */
  getCardSecret: (cardSecret: string) => Promise<CardSecret | undefined>;
}

type ParseStore = ParseStoreState & ParseStoreAction;

export const useParseStore = create<ParseStore>()((set) => ({
  tocSections: [],
  cardSecret: undefined,
  setTocSections: (tocSections) => set({ tocSections }),
  setCardSecret: (cardSecret) => set({ cardSecret }),
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
