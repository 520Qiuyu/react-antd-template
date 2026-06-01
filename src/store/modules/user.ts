import { reqGetAuthList } from '@/apis';
import {
  clearAllLocalUserInfo,
  clearLocalUserInfo,
  getLocalAuthority,
  getLocalUserInfo,
  setLocalAuthority,
  setLocalUserInfo,
} from '@/utils/userInfo';
import { create } from 'zustand';

interface UserStoreState {
  /** 用户信息 */
  userInfo?: UserInfo | null;
  /** 权限码 */
  auth: string[];
}

interface UserStoreAction {
  /**
   * 设置用户信息，并同步到本地缓存。
   */
  setUserInfo: (userInfo: UserInfo | null) => void;
  /**
   * 设置权限码，并同步到本地缓存。
   */
  setAuth: (auth: string[]) => void;
  /**
   * 清空用户信息、token 和权限码。
   */
  clearUser: () => void;
  /**
   * 获取当前用户权限码，并写入 store 与本地缓存。
   */
  getAuth: () => Promise<void>;
}

type UserStore = UserStoreState & UserStoreAction;

export const useUserStore = create<UserStore>((set, get) => ({
  // 用户信息
  userInfo: getLocalUserInfo(),
  // 权限码
  auth: getLocalAuthority(),
  setUserInfo: (userInfo) => {
    if (userInfo) {
      setLocalUserInfo(userInfo);
    } else {
      clearLocalUserInfo();
    }

    set({ userInfo });
  },
  setAuth: (auth) => {
    setLocalAuthority(auth);
    set({ auth });
  },
  clearUser: () => {
    clearAllLocalUserInfo();
    set({ userInfo: null, auth: [] });
  },
  getAuth: async () => {
    try {
      const res = await reqGetAuthList();
      const auth = Array.isArray(res.data) ? res.data : [];

      get().setAuth(auth);
    } catch (error) {
      console.log('error', error);
    }
  },
}));
