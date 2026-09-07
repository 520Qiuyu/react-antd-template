import type {
  NeteaseApiSong,
  NeteaseSongDetailData,
  NeteaseSongDownloadData,
  ParseNeteasePlaylistResponseData,
} from '@/types/netease';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import {
  deletePlaylistIndexedDb,
  listPlaylistSongs,
  mergeSongsParseInfo,
  putTrackParseInfo,
  resetPlaylistParseInfo,
  resolvePlaylistPersistId,
  syncAndLoadParseInfo,
} from './playlistParseInfoIdb';

export type PlaylistParseResult = ParseNeteasePlaylistResponseData;

/** 曲目下载状态（独立于解析结果） */
export type TrackDownloadStatus = 'idle' | 'downloading' | 'embedding' | 'success' | 'error';

/** 单首曲目下载信息 */
export interface TrackDownloadInfo {
  status: TrackDownloadStatus;
  /** 0–100，仅内存；刷新后不恢复 */
  progress?: number;
  errorMsg?: string | null;
}

interface State {
  result: PlaylistParseResult | null;
  /** 各音质档位解析到的下载信息，key 为 level + 编码 */
  downloads: Record<string, NeteaseSongDownloadData>;
  /** 曲目下载态：key = trackId */
  trackDownloadMap: Record<number, TrackDownloadInfo>;
}

interface Actions {
  setResult: (result: PlaylistParseResult | null) => void;
  setDownload: (key: string, download: NeteaseSongDownloadData) => void;
  /** 写入某首曲目的 parseInfo */
  patchTrackParseInfo: (trackId: number, parseInfo: NeteaseSongDetailData) => void;
  /** 合并更新单首下载信息 */
  setTrackDownload: (trackId: number, patch: Partial<TrackDownloadInfo>) => void;
  /** 清空全部下载态 */
  clearTrackDownloads: () => void;
}

const PERSIST_DEBOUNCE_MS = 300;

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

/** localStorage 只保留曲目展示字段，parseInfo 走 IndexedDB */
const slimSongsForPersist = (songs: NeteaseApiSong[] | undefined) =>
  songs?.map((song) => {
    if (!song.parseInfo) return song;
    const rest = { ...song };
    delete rest.parseInfo;
    return rest;
  });

/**
 * localStorage 只保留歌单骨架，parseInfo 走 IndexedDB
 * @example
 * slimResultForPersist(result)
 */
const slimResultForPersist = (result: PlaylistParseResult | null): PlaylistParseResult | null => {
  if (!result) return null;
  const playlist = result.detail?.playlist;
  return {
    ...result,
    all: result.all
      ? { ...result.all, songs: slimSongsForPersist(result.all.songs) }
      : result.all,
    detail: playlist
      ? {
          ...result.detail,
          playlist: {
            ...playlist,
            tracks: slimSongsForPersist(playlist.tracks),
          },
        }
      : result.detail,
  };
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPersist: { name: string; value: string } | null = null;
let lastPersistedValue = '';

const flushPendingPersist = () => {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!pendingPersist) return;
  const { name, value } = pendingPersist;
  pendingPersist = null;
  localStorage.setItem(name, value);
  lastPersistedValue = value;
};

/**
 * 去抖 + 跳过未变化内容的 localStorage adapter，避免进度刷新把整份歌单反复写入
 * @example
 * createJSONStorage(() => debouncedLocalStorage)
 */
const debouncedLocalStorage: StateStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    if (value != null) lastPersistedValue = value;
    return value;
  },
  setItem: (name, value) => {
    if (value === lastPersistedValue) return;
    pendingPersist = { name, value };
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(flushPendingPersist, PERSIST_DEBOUNCE_MS);
  },
  removeItem: (name) => {
    lastPersistedValue = '';
    pendingPersist = null;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    localStorage.removeItem(name);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingPersist);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingPersist();
  });
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
    (set, get) => ({
      result: null,
      downloads: {},
      trackDownloadMap: {},
      setResult: (result) => {
        set({ result, downloads: {}, trackDownloadMap: {} });
        void deletePlaylistIndexedDb();
        const playlistId = resolvePlaylistPersistId(result);
        if (playlistId) {
          void resetPlaylistParseInfo(playlistId);
        }
      },
      setDownload: (key, download) =>
        set((state) => ({ downloads: { ...state.downloads, [key]: download } })),
      patchTrackParseInfo: (trackId, parseInfo) => {
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
        });
        const playlistId = resolvePlaylistPersistId(get().result);
        if (playlistId) {
          void putTrackParseInfo(playlistId, trackId, parseInfo);
        }
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
      name: 'netease-playlist-parse',
      storage: createJSONStorage(() => debouncedLocalStorage),
      partialize: (state) => ({
        result: slimResultForPersist(state.result),
        downloads: state.downloads,
        trackDownloadMap: persistDownloadMap(state.trackDownloadMap),
      }),
    },
  ),
);

/**
 * 启动时把 IndexedDB 中的 parseInfo 灌回内存，并顺带把旧版胖 localStorage 迁走
 * @example
 * await hydratePlaylistParseInfo()
 */
const hydratePlaylistParseInfo = async () => {
  const { result } = usePlaylistParseStore.getState();
  if (!result) return;
  const playlistId = resolvePlaylistPersistId(result);
  if (!playlistId) return;
  const prevSongs = listPlaylistSongs(result);
  const parseInfoMap = await syncAndLoadParseInfo(playlistId, prevSongs);
  const latest = usePlaylistParseStore.getState().result;
  if (resolvePlaylistPersistId(latest) !== playlistId) return;

  const allSongs = latest?.all?.songs;
  const playlistTracks = latest?.detail?.playlist?.tracks;
  const mergedAll = mergeSongsParseInfo(allSongs, parseInfoMap) ?? allSongs;
  const mergedTracks = mergeSongsParseInfo(playlistTracks, parseInfoMap) ?? playlistTracks;
  const hasMerged =
    mergedAll?.some((song, index) => song !== allSongs?.[index]) ||
    mergedTracks?.some((song, index) => song !== playlistTracks?.[index]);
  const needsSlimRewrite =
    Boolean(allSongs?.some((song) => song.parseInfo)) ||
    Boolean(playlistTracks?.some((song) => song.parseInfo));
  if (!hasMerged && !needsSlimRewrite) return;

  const playlist = latest?.detail?.playlist;
  usePlaylistParseStore.setState({
    result: {
      ...latest!,
      all: latest!.all ? { ...latest!.all, songs: mergedAll } : latest!.all,
      detail: playlist
        ? {
            ...latest!.detail,
            playlist: { ...playlist, tracks: mergedTracks },
          }
        : latest!.detail,
    },
  });
};

const bindParseInfoHydration = () => {
  if (usePlaylistParseStore.persist.hasHydrated()) {
    void hydratePlaylistParseInfo();
    return;
  }
  usePlaylistParseStore.persist.onFinishHydration(() => {
    void hydratePlaylistParseInfo();
  });
};

bindParseInfoHydration();
