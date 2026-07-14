import type { MusicInfo } from '@/types/qishui';
import { create } from 'zustand';

interface LinkParseStoreState {
  /** 歌曲解析结果 */
  songHasResult: MusicInfo | null;
  /** 歌单解析结果 */
  playlistHasResult: boolean;
  /** 目录 */
  tocSections: TocSection[];
}

interface LinkParseStoreAction {
  /** 设置歌曲解析结果 */
  setSongHasResult: (songHasResult: MusicInfo | null) => void;
  /** 设置歌单解析结果 */
  setPlaylistHasResult: (playlistHasResult: boolean) => void;
  /** 设置目录 */
  setTocSections: (tocSections: TocSection[]) => void;
}

type LinkParseStore = LinkParseStoreState & LinkParseStoreAction;

export const useLinkParseStore = create<LinkParseStore>((set) => ({
  songHasResult: null,
  setSongHasResult: (songHasResult) => set({ songHasResult }),
  playlistHasResult: false,
  setPlaylistHasResult: (playlistHasResult) => set({ playlistHasResult }),
  tocSections: [],
  setTocSections: (tocSections) => set({ tocSections }),
}));

export interface TocSection {
  id: string;
  label: string;
}
