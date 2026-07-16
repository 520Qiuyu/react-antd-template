import type { MusicInfo, PlaylistInfo } from '@/types/qishui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TrackDownloadStatus = 'success' | 'error';

interface PlaylistParseStoreState {
  /** 歌单解析结果（含 tracks[].fullInfo / downloadStatus） */
  playlistHasResult: PlaylistInfo | null;
}

interface PlaylistParseStoreAction {
  /** 设置歌单解析结果 */
  setPlaylistHasResult: (playlistHasResult: PlaylistInfo | null) => void;
  /** 写入歌单某曲目的 fullInfo（原子更新，避免并发覆盖） */
  patchPlaylistTrackFullInfo: (trackId: string, fullInfo: MusicInfo) => void;
  /** 写入单首下载状态到 playlistHasResult.tracks */
  setTrackDownloadStatus: (trackId: string, downloadStatus: TrackDownloadStatus) => void;
  /** 清空歌单内全部下载状态 */
  clearPlaylistDownloadStatus: () => void;
}

type PlaylistParseStore = PlaylistParseStoreState & PlaylistParseStoreAction;

export const usePlaylistParseStore = create<PlaylistParseStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'qishui-playlist-parse',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlistHasResult: state.playlistHasResult,
      }),
    },
  ),
);
