import type {
  NeteaseSongDetailData,
  NeteaseSongDownloadData,
  ParseNeteaseAlbumResponseData,
} from '@/types/netease';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TrackDownloadInfo } from './usePlaylistParseStore';

export type AlbumParseResult = ParseNeteaseAlbumResponseData;

interface State {
  result: AlbumParseResult | null;
  /** 各音质档位解析到的下载信息，key 为 level + 编码 */
  downloads: Record<string, NeteaseSongDownloadData>;
  /** 曲目下载态：key = trackId */
  trackDownloadMap: Record<number, TrackDownloadInfo>;
}

interface Actions {
  setResult: (result: AlbumParseResult | null) => void;
  setDownload: (key: string, download: NeteaseSongDownloadData) => void;
  /** 写入某首曲目的 parseInfo */
  patchTrackParseInfo: (trackId: number, parseInfo: NeteaseSongDetailData) => void;
  /** 合并更新单首下载信息 */
  setTrackDownload: (trackId: number, patch: Partial<TrackDownloadInfo>) => void;
  /** 清空全部下载态 */
  clearTrackDownloads: () => void;
}

/** 仅持久化终态，去掉进行中字段 */
const persistDownloadMap = (map: Record<number, TrackDownloadInfo>) => {
  const next: Record<number, TrackDownloadInfo> = {};
  for (const [trackId, info] of Object.entries(map)) {
    if (info.status !== 'success' && info.status !== 'error') continue;
    next[Number(trackId)] = {
      status: info.status,
      ...(info.errorMsg ? { errorMsg: info.errorMsg } : {}),
    };
  }
  return next;
};

export const useAlbumParseStore = create<State & Actions>()(
  persist(
    (set) => ({
      result: null,
      downloads: {},
      trackDownloadMap: {},
      setResult: (result) => set({ result, downloads: {}, trackDownloadMap: {} }),
      setDownload: (key, download) =>
        set((state) => ({ downloads: { ...state.downloads, [key]: download } })),
      patchTrackParseInfo: (trackId, parseInfo) => {
        set((state) => {
          const result = state.result;
          if (!result) return state;
          return {
            result: {
              ...result,
              songs: result.songs.map((song) =>
                song.id === trackId ? { ...song, parseInfo } : song,
              ),
            },
          };
        });
      },
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
      name: 'netease-album-parse',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        result: state.result,
        downloads: state.downloads,
        trackDownloadMap: persistDownloadMap(state.trackDownloadMap),
      }),
    },
  ),
);
