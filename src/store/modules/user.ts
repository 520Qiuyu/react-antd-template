import { reqGetSelfUserInfo } from '@/apis';
import {
  clearAllLocalUserInfo,
  clearLocalUserInfo,
  getLocalUserInfo,
  setLocalUserInfo,
} from '@/utils/userInfo';
import { create } from 'zustand';

interface UserStoreState {
  /** 用户信息 */
  userInfo?: UserInfo | null;
}

interface UserStoreAction {
  /**
   * 设置用户信息，并同步到本地缓存。
   */
  setUserInfo: (userInfo: UserInfo | null) => void;
  /**
   * 清空用户信息、token 和权限码。
   */
  clearUser: () => void;
  /**
   * 获取用户信息
   */
  getUserInfo: () => Promise<UserInfo | null | undefined>;
}

type UserStore = UserStoreState & UserStoreAction;

export const useUserStore = create<UserStore>((set, get) => ({
  // 用户信息
  userInfo: getLocalUserInfo(),
  setUserInfo: (userInfo) => {
    if (userInfo) {
      setLocalUserInfo(userInfo);
    } else {
      clearLocalUserInfo();
    }

    set({ userInfo });
  },
  clearUser: () => {
    clearAllLocalUserInfo();
    set({ userInfo: null });
  },
  getUserInfo: async () => {
    try {
      const res = await reqGetSelfUserInfo();
      if (res.code === 200) {
        set({ userInfo: res.data });
        setLocalUserInfo(res.data!);
        return res.data as UserInfo;
      }
      return null;
    } catch (error) {
      console.log('error', error);
    }
  },
}));
