import type { MusicInfo, PlaylistInfo } from '@/types/qishui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TrackDownloadStatus = 'success' | 'error';

interface LinkParseStoreState {
  /** 歌曲解析结果 */
  songHasResult: MusicInfo | null;
  /** 歌单解析结果（含 tracks[].fullInfo / downloadStatus） */
  playlistHasResult: PlaylistInfo | null;
  /** 目录 */
  tocSections: TocSection[];
}

interface LinkParseStoreAction {
  /** 设置歌曲解析结果 */
  setSongHasResult: (songHasResult: MusicInfo | null) => void;
  /** 设置歌单解析结果 */
  setPlaylistHasResult: (playlistHasResult: PlaylistInfo | null) => void;
  /** 写入歌单某曲目的 fullInfo（原子更新，避免并发覆盖） */
  patchPlaylistTrackFullInfo: (trackId: string, fullInfo: MusicInfo) => void;
  /** 写入单首下载状态到 playlistHasResult.tracks */
  setTrackDownloadStatus: (trackId: string, downloadStatus: TrackDownloadStatus) => void;
  /** 清空歌单内全部下载状态 */
  clearPlaylistDownloadStatus: () => void;
  /** 设置目录 */
  setTocSections: (tocSections: TocSection[]) => void;
}

type LinkParseStore = LinkParseStoreState & LinkParseStoreAction;

export const useLinkParseStore = create<LinkParseStore>()(
  persist(
    (set) => ({
      songHasResult: null,
      setSongHasResult: (songHasResult) => set({ songHasResult }),
      playlistHasResult: null,
      setPlaylistHasResult: (playlistHasResult) => set({ playlistHasResult }),
      patchPlaylistTrackFullInfo: (trackId, fullInfo) =>
        set((state) => {
          if (!state.playlistHasResult?.tracks) return state;
          return {
            playlistHasResult: {
              ...state.playlistHasResult,
              tracks: state.playlistHasResult.tracks.map((track) =>
                track.id === trackId ? { ...track, fullInfo } : track,
              ),
            },
          };
        }),
      setTrackDownloadStatus: (trackId, downloadStatus) =>
        set((state) => {
          if (!state.playlistHasResult?.tracks) return state;
          return {
            playlistHasResult: {
              ...state.playlistHasResult,
              tracks: state.playlistHasResult.tracks.map((track) =>
                track.id === trackId ? { ...track, downloadStatus } : track,
              ),
            },
          };
        }),
      clearPlaylistDownloadStatus: () =>
        set((state) => {
          if (!state.playlistHasResult?.tracks) return state;
          return {
            playlistHasResult: {
              ...state.playlistHasResult,
              tracks: state.playlistHasResult.tracks.map(
                ({ downloadStatus: _, ...track }) => track,
              ),
            },
          };
        }),
      tocSections: [],
      setTocSections: (tocSections) => set({ tocSections }),
    }),
    {
      name: 'qishui-link-parse',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        songHasResult: state.songHasResult,
        playlistHasResult: state.playlistHasResult,
      }),
    },
  ),
);

export interface TocSection {
  id: string;
  label: string;
}
