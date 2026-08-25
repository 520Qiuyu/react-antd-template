import type { MusicInfo, PlaylistInfo } from '@/types/qishui';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { DownloadProgressPhase } from '../downloadSong';
import {
  deletePlaylistIndexedDb,
  mergeTracksFullInfo,
  putTrackFullInfo,
  resetPlaylistFullInfo,
  resolvePlaylistPersistId,
  syncAndLoadFullInfo,
} from './playlistFullInfoIdb';

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

interface PlaylistParsePersistState {
  playlistHasResult: PlaylistInfo | null;
  trackDownloadMap: Record<string, TrackDownloadInfo>;
}

const PERSIST_DEBOUNCE_MS = 300;

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

/**
 * localStorage 只保留曲目展示字段，fullInfo 走 IndexedDB。
 * @example
 * slimPlaylistForPersist(playlist);
 */
const slimPlaylistForPersist = (playlist: PlaylistInfo | null): PlaylistInfo | null => {
  if (!playlist) return null;
  return {
    ...playlist,
    tracks: (playlist.tracks || []).map((track) => {
      const rest = { ...track };
      delete rest.fullInfo;
      return rest;
    }),
  };
};

const isQuotaExceededError = (error: unknown) => {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22
  );
};

const omitTrackCovers = (value: string) => {
  const parsed = JSON.parse(value) as { state?: PlaylistParsePersistState };
  const playlist = parsed.state?.playlistHasResult;
  if (!playlist?.tracks) return value;
  parsed.state = {
    ...parsed.state!,
    playlistHasResult: {
      ...playlist,
      tracks: playlist.tracks.map((track) => {
        const rest = { ...track };
        delete rest.cover;
        return rest;
      }),
    },
  };
  return JSON.stringify(parsed);
};

const dropPersistTracks = (value: string) => {
  const parsed = JSON.parse(value) as { state?: PlaylistParsePersistState };
  const playlist = parsed.state?.playlistHasResult;
  if (!playlist) return value;
  parsed.state = {
    ...parsed.state!,
    playlistHasResult: {
      ...playlist,
      tracks: [],
    },
  };
  return JSON.stringify(parsed);
};

/**
 * 带降级的 localStorage 写入：配额不足时依次去掉封面、曲目列表。
 * @example
 * writeLocalStorage('qishui-playlist-parse', json);
 */
const writeLocalStorage = (name: string, value: string) => {
  const candidates = [
    () => value,
    () => omitTrackCovers(value),
    () => dropPersistTracks(value),
  ];
  for (const getCandidate of candidates) {
    try {
      const candidate = getCandidate();
      localStorage.setItem(name, candidate);
      return candidate;
    } catch (error) {
      if (!isQuotaExceededError(error)) throw error;
    }
  }
  console.warn('[playlistParseStore] localStorage 配额不足，本次未写入歌单缓存');
  return null;
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
  const written = writeLocalStorage(name, value);
  if (written != null) {
    lastPersistedValue = value;
  }
};

const schedulePersist = (name: string, value: string) => {
  if (value === lastPersistedValue) return;
  pendingPersist = { name, value };
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flushPendingPersist, PERSIST_DEBOUNCE_MS);
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingPersist);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingPersist();
  });
}

/** 去抖 + 跳过未变化内容的 localStorage adapter */
const playlistLocalStorage: StateStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    if (value != null) lastPersistedValue = value;
    return value;
  },
  setItem: (name, value) => {
    schedulePersist(name, value);
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

export const usePlaylistParseStore = create<PlaylistParseStore>()(
  persist(
    (set, get) => ({
      playlistHasResult: null,
      trackDownloadMap: {},
      setPlaylistHasResult: (playlistHasResult) => {
        set({
          playlistHasResult,
          trackDownloadMap: {},
        });
        void deletePlaylistIndexedDb();
        const playlistId = resolvePlaylistPersistId(playlistHasResult);
        if (playlistId) {
          void resetPlaylistFullInfo(playlistId);
        }
      },
      patchPlaylistTrackFullInfo: (trackId, fullInfo) => {
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
        });
        const playlistId = resolvePlaylistPersistId(get().playlistHasResult);
        if (playlistId) {
          void putTrackFullInfo(playlistId, trackId, fullInfo);
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
      name: 'qishui-playlist-parse',
      storage: createJSONStorage(() => playlistLocalStorage),
      partialize: (state) => ({
        playlistHasResult: slimPlaylistForPersist(state.playlistHasResult),
        trackDownloadMap: persistDownloadMap(state.trackDownloadMap),
      }),
    },
  ),
);

/**
 * 启动时把 IndexedDB 中的 fullInfo 灌回内存，并顺带把旧版胖 localStorage 迁走。
 * @example
 * await hydratePlaylistFullInfo();
 */
const hydratePlaylistFullInfo = async () => {
  const { playlistHasResult } = usePlaylistParseStore.getState();
  if (!playlistHasResult) return;
  const playlistId = resolvePlaylistPersistId(playlistHasResult);
  if (!playlistId) return;
  const prevTracks = playlistHasResult.tracks || [];
  const fullInfoMap = await syncAndLoadFullInfo(playlistId, prevTracks);
  const latest = usePlaylistParseStore.getState().playlistHasResult;
  if (resolvePlaylistPersistId(latest) !== playlistId) return;
  const latestTracks = latest?.tracks || [];
  const tracks = mergeTracksFullInfo(latestTracks, fullInfoMap);
  const hasMerged = tracks.some((track, index) => track !== latestTracks[index]);
  const needsSlimRewrite = latestTracks.some((track) => Boolean(track.fullInfo));
  if (!hasMerged && !needsSlimRewrite) return;
  usePlaylistParseStore.setState({
    playlistHasResult: {
      ...latest!,
      tracks,
    },
  });
};

const bindFullInfoHydration = () => {
  if (usePlaylistParseStore.persist.hasHydrated()) {
    void hydratePlaylistFullInfo();
    return;
  }
  usePlaylistParseStore.persist.onFinishHydration(() => {
    void hydratePlaylistFullInfo();
  });
};

bindFullInfoHydration();
