import type { MusicInfo, PlaylistInfo, PlaylistMusicInfo } from '@/types/qishui';

const DB_NAME = 'qishui-playlist-parse';
const DB_VERSION = 1;
const STORE_FULL_INFO = 'fullInfo';
const STORE_META = 'meta';
const META_PLAYLIST_ID_KEY = 'playlistId';

/** IndexedDB 串行队列，避免换歌单 clear 与单曲 put 交叉 */
let idbChain: Promise<void> = Promise.resolve();

let dbPromise: Promise<IDBDatabase> | null = null;

const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = idbChain.then(task, task);
  idbChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const waitTx = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const isIndexedDbAvailable = () =>
  typeof indexedDB !== 'undefined' && typeof window !== 'undefined';

const openDb = () => {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_FULL_INFO)) {
          db.createObjectStore(STORE_FULL_INFO);
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        db.onclose = () => {
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
};

const getMetaPlaylistId = async (db: IDBDatabase) => {
  const tx = db.transaction(STORE_META, 'readonly');
  const value = await requestToPromise(
    tx.objectStore(STORE_META).get(META_PLAYLIST_ID_KEY),
  );
  return typeof value === 'string' ? value : null;
};

const setMetaPlaylistId = (db: IDBDatabase, playlistId: string | null) => {
  const tx = db.transaction(STORE_META, 'readwrite');
  const store = tx.objectStore(STORE_META);
  if (playlistId) {
    store.put(playlistId, META_PLAYLIST_ID_KEY);
  } else {
    store.delete(META_PLAYLIST_ID_KEY);
  }
  return waitTx(tx);
};

const clearFullInfoStore = (db: IDBDatabase) => {
  const tx = db.transaction(STORE_FULL_INFO, 'readwrite');
  tx.objectStore(STORE_FULL_INFO).clear();
  return waitTx(tx);
};

const warnIdb = (error: unknown) => {
  console.warn('[playlistFullInfoIdb]', error);
};

/**
 * 生成本次歌单在 IndexedDB 中的隔离 key。
 * @example
 * resolvePlaylistPersistId(playlist); // '7380550365186621459'
 */
export const resolvePlaylistPersistId = (playlist: PlaylistInfo | null) => {
  if (!playlist) return null;
  if (playlist.id) return playlist.id;
  return `fallback:${playlist.source ?? 'playlist'}:${playlist.title}:${playlist.owner}`;
};

const closeCachedDb = async () => {
  if (!dbPromise) return;
  const pending = dbPromise;
  dbPromise = null;
  try {
    const db = await pending;
    db.close();
  } catch {
    /* 打开失败时无需再关 */
  }
};

/**
 * 删除歌单 fullInfo 整库（清空或换歌单时使用）。
 * @example
 * await deletePlaylistIndexedDb();
 */
export const deletePlaylistIndexedDb = () =>
  enqueue(async () => {
    if (!isIndexedDbAvailable()) return;
    try {
      await closeCachedDb();
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          /* 等其他连接关闭后仍会走到 onsuccess */
        };
      });
    } catch (error) {
      warnIdb(error);
    }
  });

/**
 * 清空 fullInfo，并切换到新的歌单隔离 key。
 * @example
 * await resetPlaylistFullInfo(playlist.id);
 */
export const resetPlaylistFullInfo = (playlistId: string) =>
  enqueue(async () => {
    if (!isIndexedDbAvailable()) return;
    try {
      const db = await openDb();
      await clearFullInfoStore(db);
      await setMetaPlaylistId(db, playlistId);
    } catch (error) {
      warnIdb(error);
    }
  });

/**
 * 写入单首曲目的 fullInfo。
 * @example
 * await putTrackFullInfo(playlistId, track.id, fullInfo);
 */
export const putTrackFullInfo = (
  playlistId: string,
  trackId: string,
  fullInfo: MusicInfo,
) =>
  enqueue(async () => {
    if (!isIndexedDbAvailable()) return;
    try {
      const db = await openDb();
      const currentId = await getMetaPlaylistId(db);
      if (currentId && currentId !== playlistId) return;
      if (!currentId) {
        await setMetaPlaylistId(db, playlistId);
      }
      const tx = db.transaction(STORE_FULL_INFO, 'readwrite');
      tx.objectStore(STORE_FULL_INFO).put(fullInfo, trackId);
      await waitTx(tx);
    } catch (error) {
      warnIdb(error);
    }
  });

/**
 * 把内存里已有的 fullInfo 同步进 IndexedDB，再读出完整 map。
 * @example
 * const map = await syncAndLoadFullInfo(playlistId, tracks);
 */
export const syncAndLoadFullInfo = (
  playlistId: string,
  tracks: PlaylistMusicInfo[],
) =>
  enqueue(async () => {
    if (!isIndexedDbAvailable()) return {} as Record<string, MusicInfo>;
    try {
      const db = await openDb();
      const currentId = await getMetaPlaylistId(db);
      if (currentId && currentId !== playlistId) {
        return {} as Record<string, MusicInfo>;
      }
      await setMetaPlaylistId(db, playlistId);

      const pending = tracks.filter((track) => track.id && track.fullInfo);
      if (pending.length) {
        const tx = db.transaction(STORE_FULL_INFO, 'readwrite');
        const store = tx.objectStore(STORE_FULL_INFO);
        pending.forEach((track) => {
          if (!track.id || !track.fullInfo) return;
          store.put(track.fullInfo, track.id);
        });
        await waitTx(tx);
      }

      const readTx = db.transaction(STORE_FULL_INFO, 'readonly');
      const store = readTx.objectStore(STORE_FULL_INFO);
      const [keys, values] = await Promise.all([
        requestToPromise(store.getAllKeys()),
        requestToPromise(store.getAll()),
      ]);
      const map: Record<string, MusicInfo> = {};
      keys.forEach((key, index) => {
        map[String(key)] = values[index];
      });
      return map;
    } catch (error) {
      warnIdb(error);
      return {} as Record<string, MusicInfo>;
    }
  });

/**
 * 把 IndexedDB 中的 fullInfo 合并回曲目列表；内存已有的优先。
 * @example
 * const tracks = mergeTracksFullInfo(playlist.tracks, fullInfoMap);
 */
export const mergeTracksFullInfo = (
  tracks: PlaylistMusicInfo[],
  fullInfoMap: Record<string, MusicInfo>,
) =>
  tracks.map((track) => {
    if (!track.id || track.fullInfo) return track;
    const fullInfo = fullInfoMap[track.id];
    return fullInfo ? { ...track, fullInfo } : track;
  });
