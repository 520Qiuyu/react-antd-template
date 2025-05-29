import { configureStore } from '@reduxjs/toolkit';
import template from './modules/template';
import app from './modules/app';
import user from './modules/user';

const store = configureStore({
  reducer: {
    template,
    app,
    user,
  },
});

export default store;

// 从 store 本身推断出 `RootState` 和 `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
// 类型推断: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
