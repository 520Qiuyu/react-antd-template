import type { NeteaseSongDownloadData, ParseNeteaseSongResponseData } from '@/types/netease';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface State {
  result: ParseNeteaseSongResponseData | null;
  /** 各音质档位解析到的下载信息，key 为 level + 编码 */
  downloads: Record<string, NeteaseSongDownloadData>;
}

interface Actions {
  setResult: (result: ParseNeteaseSongResponseData | null) => void;
  setDownload: (key: string, download: NeteaseSongDownloadData) => void;
}

export const useSongParseStore = create<State & Actions>()(
  persist(
    (set) => ({
      result: null,
      downloads: {},
      setResult: (result) => set({ result, downloads: {} }),
      setDownload: (key, download) =>
        set((state) => ({
          downloads: { ...state.downloads, [key]: download },
        })),
    }),
    {
      name: 'netease-song-parse',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
