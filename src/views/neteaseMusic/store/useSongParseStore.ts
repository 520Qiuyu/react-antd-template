import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { NeteaseSongInfo } from '../types';

interface State {
  result: NeteaseSongInfo | null;
}

interface Actions {
  setResult: (result: NeteaseSongInfo | null) => void;
}
export const useSongParseStore = create<State & Actions>()(
  persist(
    (set) => ({
      result: null,
      setResult: (result) => set({ result }),
    }),
    {
      name: 'netease-song',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
