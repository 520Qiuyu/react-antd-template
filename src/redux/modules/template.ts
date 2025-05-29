import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch } from 'react';
import type { AppDispatch } from '../store';

export const templateSlice = createSlice({
  name: 'template',
  initialState: {
    //state
    count: 0,
  },
  reducers: {
    //reducers
    increment: (state) => {
      console.log('state', state);
      // Redux Toolkit 允许我们在 reducers 中编写 mutating 逻辑。
      // 它实际上并没有 mutate state 因为它使用了 Immer 库，
      // 它检测到草稿 state 的变化并产生一个全新的基于这些更改的不可变 state
      state.count += 1;
    },
    decrement: (state) => {
      state.count -= 1;
    },
    incrementByAmount: (state, action) => {
      state.count += action.payload;
    },
  },
});

// 为每个reducer生成action creators
export const { increment, decrement, incrementByAmount } = templateSlice.actions;

// 异步action
export const incrementAsync = (amount: number) => (dispatch: AppDispatch) => {
  setTimeout(() => {
    dispatch(incrementByAmount(amount));
  }, 10000 * Math.random());
};

// 将reducer导出去
export default templateSlice.reducer;
