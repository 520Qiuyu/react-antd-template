import type {
  NeteaseApiSong,
  NeteaseSongDetailData,
  NeteaseSongDownloadData,
  ParseNeteasePlaylistResponseData,
} from '@/types/netease';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PlaylistParseResult = ParseNeteasePlaylistResponseData;

interface State {
  result: PlaylistParseResult | null;
  /** 各音质档位解析到的下载信息，key 为 level + 编码 */
  downloads: Record<string, NeteaseSongDownloadData>;
}

interface Actions {
  setResult: (result: PlaylistParseResult | null) => void;
  setDownload: (key: string, download: NeteaseSongDownloadData) => void;
  /** 写入某首曲目的 parseInfo */
  patchTrackParseInfo: (trackId: number, parseInfo: NeteaseSongDetailData) => void;
}

/**
 * 把 parseInfo 写回 all.songs / playlist.tracks 中对应曲目
 * @example
 * patchSongs(songs, 347230, parseInfo)
 */
const patchSongs = (songs: NeteaseApiSong[] | undefined, trackId: number, parseInfo: NeteaseSongDetailData) =>
  songs?.map((song) => (song.id === trackId ? { ...song, parseInfo } : song));

export const usePlaylistParseStore = create<State & Actions>()(
  persist(
    (set) => ({
      result: null,
      downloads: {},
      setResult: (result) => set({ result, downloads: {} }),
      setDownload: (key, download) =>
        set((state) => ({ downloads: { ...state.downloads, [key]: download } })),
      patchTrackParseInfo: (trackId, parseInfo) =>
        set((state) => {
          const result = state.result;
          if (!result) return state;
          const playlist = result.detail?.playlist;
          return {
            result: {
              ...result,
              all: result.all
                ? { ...result.all, songs: patchSongs(result.all.songs, trackId, parseInfo) }
                : result.all,
              detail: playlist
                ? {
                    ...result.detail,
                    playlist: {
                      ...playlist,
                      tracks: patchSongs(playlist.tracks, trackId, parseInfo),
                    },
                  }
                : result.detail,
            },
          };
        }),
    }),
    {
      name: 'netease-playlist-parse',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
