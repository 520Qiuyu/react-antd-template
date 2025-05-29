/**
 * 文件名 Reduxx.js
 */
import { Provider } from 'react-redux';
import store from './store';

// 3. 将全局useReducer返回的state和dispatch传递给全局Context.Provider的value中
export const ReduxProvider = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
