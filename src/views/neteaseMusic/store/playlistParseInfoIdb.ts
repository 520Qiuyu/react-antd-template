import type { NeteaseApiSong, NeteaseSongDetailData, ParseNeteasePlaylistResponseData } from '@/types/netease';

const DB_NAME = 'netease-playlist-parse';
const DB_VERSION = 1;
const STORE_PARSE_INFO = 'parseInfo';
const STORE_META = 'meta';
const META_PLAYLIST_ID_KEY = 'playlistId';

/** IndexedDB 串行队列，避免换歌单 clear 与单曲 put 交叉 */
let idbChain: Promise<void> = Promise.resolve();
/** 数据库连接 Promise */
let dbPromise: Promise<IDBDatabase> | null = null;

/** 串行队列，避免换歌单 clear 与单曲 put 交叉 */
const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = idbChain.then(task, task);
  idbChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

/** 把 IDBRequest 转换为 Promise */
const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/** 等待事务完成 */
const waitTx = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

/** 检查 IndexedDB 是否可用 */
const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined' && typeof window !== 'undefined';

/** 打开数据库 */
const openDb = () => {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_PARSE_INFO)) {
          db.createObjectStore(STORE_PARSE_INFO);
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

/** 获取当前隔离的歌单 ID */
const getMetaPlaylistId = async (db: IDBDatabase) => {
  const tx = db.transaction(STORE_META, 'readonly');
  const value = await requestToPromise(tx.objectStore(STORE_META).get(META_PLAYLIST_ID_KEY));
  return typeof value === 'string' ? value : null;
};

/** 设置当前隔离的歌单 ID */
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

/** 清空 parseInfo 存储 */
const clearParseInfoStore = (db: IDBDatabase) => {
  const tx = db.transaction(STORE_PARSE_INFO, 'readwrite');
  tx.objectStore(STORE_PARSE_INFO).clear();
  return waitTx(tx);
};

/** 打印 IndexedDB 错误 */
const warnIdb = (error: unknown) => {
  console.warn('[playlistParseInfoIdb]', error);
};

/**
 * 收集歌单里两处曲目列表（all.songs / playlist.tracks）
 * @example
 * listPlaylistSongs(result)
 */
export const listPlaylistSongs = (result: ParseNeteasePlaylistResponseData | null): NeteaseApiSong[] => {
  const allSongs = result?.all?.songs || [];
  if (allSongs.length) return allSongs;
  return result?.detail?.playlist?.tracks || [];
};

/**
 * 生成本次歌单在 IndexedDB 中的隔离 key
 * @example
 * resolvePlaylistPersistId(result) // '3778678'
 */
export const resolvePlaylistPersistId = (result: ParseNeteasePlaylistResponseData | null) => {
  if (!result) return null;
  const playlistId = result.detail?.playlist?.id;
  if (playlistId) return String(playlistId);
  const firstId = result.all?.songs?.[0]?.id;
  return firstId ? `fallback:${firstId}` : null;
};

/** 关闭缓存的数据库连接 */
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
 * 删除歌单 parseInfo 整库（清空或换歌单时使用）
 * @example
 * await deletePlaylistIndexedDb()
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
 * 清空 parseInfo，并切换到新的歌单隔离 key
 * @example
 * await resetPlaylistParseInfo(playlistId)
 */
export const resetPlaylistParseInfo = (playlistId: string) =>
  enqueue(async () => {
    if (!isIndexedDbAvailable()) return;
    try {
      const db = await openDb();
      await clearParseInfoStore(db);
      await setMetaPlaylistId(db, playlistId);
    } catch (error) {
      warnIdb(error);
    }
  });

/**
 * 写入单首曲目的 parseInfo
 * @example
 * await putTrackParseInfo(playlistId, 347230, parseInfo)
 */
export const putTrackParseInfo = (
  playlistId: string,
  trackId: number,
  parseInfo: NeteaseSongDetailData,
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
      const tx = db.transaction(STORE_PARSE_INFO, 'readwrite');
      tx.objectStore(STORE_PARSE_INFO).put(parseInfo, String(trackId));
      await waitTx(tx);
    } catch (error) {
      warnIdb(error);
    }
  });

/**
 * 把内存里已有的 parseInfo 同步进 IndexedDB，再读出完整 map
 * @example
 * const map = await syncAndLoadParseInfo(playlistId, songs)
 */
export const syncAndLoadParseInfo = (playlistId: string, songs: NeteaseApiSong[]) =>
  enqueue(async () => {
    if (!isIndexedDbAvailable()) return {} as Record<string, NeteaseSongDetailData>;
    try {
      const db = await openDb();
      const currentId = await getMetaPlaylistId(db);
      if (currentId && currentId !== playlistId) {
        return {} as Record<string, NeteaseSongDetailData>;
      }
      await setMetaPlaylistId(db, playlistId);

      const pending = songs.filter((song) => song.id && song.parseInfo);
      if (pending.length) {
        const tx = db.transaction(STORE_PARSE_INFO, 'readwrite');
        const store = tx.objectStore(STORE_PARSE_INFO);
        pending.forEach((song) => {
          if (!song.id || !song.parseInfo) return;
          store.put(song.parseInfo, String(song.id));
        });
        await waitTx(tx);
      }

      const readTx = db.transaction(STORE_PARSE_INFO, 'readonly');
      const store = readTx.objectStore(STORE_PARSE_INFO);
      const [keys, values] = await Promise.all([
        requestToPromise(store.getAllKeys()),
        requestToPromise(store.getAll()),
      ]);
      const map: Record<string, NeteaseSongDetailData> = {};
      keys.forEach((key, index) => {
        map[String(key)] = values[index];
      });
      return map;
    } catch (error) {
      warnIdb(error);
      return {} as Record<string, NeteaseSongDetailData>;
    }
  });

/**
 * 把 IndexedDB 中的 parseInfo 合并回曲目列表；内存已有的优先
 * @example
 * const songs = mergeSongsParseInfo(result.all.songs, parseInfoMap)
 */
export const mergeSongsParseInfo = (
  songs: NeteaseApiSong[] | undefined,
  parseInfoMap: Record<string, NeteaseSongDetailData>,
) =>
  songs?.map((song) => {
    if (!song.id || song.parseInfo) return song;
    const parseInfo = parseInfoMap[String(song.id)];
    return parseInfo ? { ...song, parseInfo } : song;
  });
