import type { MusicInfo, PlaylistInfo } from '@/types/qishui';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DownloadProgressPhase } from '../downloadSong';

/** 曲目下载状态（独立于解析结果） */
export type TrackDownloadStatus = 'idle' | 'downloading' | 'success' | 'error';

/** 单首曲目下载信息 */
export interface TrackDownloadInfo {
  status: TrackDownloadStatus;
  /** 0–100，仅内存；刷新后不恢复 */
  progress?: number;
  /** 下载阶段，仅内存 */
  phase?: DownloadProgressPhase;
  errorMsg?: string | null;
}

interface PlaylistParseStoreState {
  /** 歌单解析结果（不含下载态） */
  playlistHasResult: PlaylistInfo | null;
  /** 曲目下载态：key = trackId */
  trackDownloadMap: Record<string, TrackDownloadInfo>;
}

interface PlaylistParseStoreAction {
  /** 设置歌单解析结果；换歌单或清空时同步清空下载态 */
  setPlaylistHasResult: (playlistHasResult: PlaylistInfo | null) => void;
  /** 写入歌单某曲目的 fullInfo（原子更新，避免并发覆盖） */
  patchPlaylistTrackFullInfo: (trackId: string, fullInfo: MusicInfo) => void;
  /** 合并更新单首下载信息 */
  setTrackDownload: (trackId: string, patch: Partial<TrackDownloadInfo>) => void;
  /** 清空全部下载态 */
  clearTrackDownloads: () => void;
}

type PlaylistParseStore = PlaylistParseStoreState & PlaylistParseStoreAction;

/** 仅持久化终态，去掉进行中字段 */
const persistDownloadMap = (map: Record<string, TrackDownloadInfo>) => {
  const next: Record<string, TrackDownloadInfo> = {};
  for (const [trackId, info] of Object.entries(map)) {
    if (info.status !== 'success' && info.status !== 'error') continue;
    next[trackId] = {
      status: info.status,
      ...(info.errorMsg ? { errorMsg: info.errorMsg } : {}),
    };
  }
  return next;
};

export const usePlaylistParseStore = create<PlaylistParseStore>()(
  persist(
    (set) => ({
      playlistHasResult: null,
      trackDownloadMap: {},
      setPlaylistHasResult: (playlistHasResult) =>
        set({
          playlistHasResult,
          trackDownloadMap: {},
        }),
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
      setTrackDownload: (trackId, patch) =>
        set((state) => {
          const prev = state.trackDownloadMap[trackId];
          const next: TrackDownloadInfo = {
            ...prev,
            ...patch,
            status: patch.status ?? prev?.status ?? 'idle',
          };
          return {
            trackDownloadMap: {
              ...state.trackDownloadMap,
              [trackId]: next,
            },
          };
        }),
      clearTrackDownloads: () => set({ trackDownloadMap: {} }),
    }),
    {
      name: 'qishui-playlist-parse',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlistHasResult: state.playlistHasResult,
        trackDownloadMap: persistDownloadMap(state.trackDownloadMap),
      }),
    },
  ),
);
