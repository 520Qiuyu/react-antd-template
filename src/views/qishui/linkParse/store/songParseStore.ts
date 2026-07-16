import type { MusicInfo } from '@/types/qishui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SongParseStoreState {
  /** 歌曲解析结果 */
  songHasResult: MusicInfo | null;
}

interface SongParseStoreAction {
  /** 设置歌曲解析结果 */
  setSongHasResult: (songHasResult: MusicInfo | null) => void;
}

type SongParseStore = SongParseStoreState & SongParseStoreAction;

export const useSongParseStore = create<SongParseStore>()(
  persist(
    (set) => ({
      songHasResult: null,
      setSongHasResult: (songHasResult) => set({ songHasResult }),
    }),
    {
      name: 'qishui-song-parse',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        songHasResult: state.songHasResult,
      }),
    },
  ),
);
