import { reqGetAuthList } from '@/apis';
import { getLocalUserInfo } from '@/utils/userInfo';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppDispatch } from '../store';

export interface UserInfoState {
  userInfo?: UserInfo | null;
  auth: string[];
}

const initialState: UserInfoState = {
  // 用户信息
  userInfo: getLocalUserInfo(),
  // 权限码
  auth: [],
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 设置用户信息
    setUserInfo: (state, action: PayloadAction<UserInfo | null>) => {
      state.userInfo = action.payload;
    },
    // 设置权限码
    setAuth: (state, action: PayloadAction<string[]>) => {
      state.auth = action.payload;
    },
  },
});

export const { setUserInfo, setAuth } = userSlice.actions;

// 异步获取权限信息
export const getAuth = async () => async (dispatch: AppDispatch) => {
  try {
    const res = await reqGetAuthList();
    console.log('res', res);
    // dispatch(setAuth(res.data));
  } catch (error) {
    console.log('error', error);
  }
};

export default userSlice.reducer;
