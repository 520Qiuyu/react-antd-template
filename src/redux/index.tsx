/**
 * 文件名 Reduxx.js
 */
import type { TypedUseSelectorHook } from 'react-redux';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import type { AppDispatch, RootState } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 3. 将全局useReducer返回的state和dispatch传递给全局Context.Provider的value中
export const ReduxProvider = ({ children }: { children: React.ReactNode }) => {
  return <Provider store={store}>{children}</Provider>;
};
