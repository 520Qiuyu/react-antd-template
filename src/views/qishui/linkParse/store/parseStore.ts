import { create } from 'zustand';

export interface TocSection {
  id: string;
  label: string;
}

interface ParseStoreState {
  /** 目录 */
  tocSections: TocSection[];
}

interface ParseStoreAction {
  /** 设置目录 */
  setTocSections: (tocSections: TocSection[]) => void;
}

type ParseStore = ParseStoreState & ParseStoreAction;

export const useParseStore = create<ParseStore>()((set) => ({
  tocSections: [],
  setTocSections: (tocSections) => set({ tocSections }),
}));
