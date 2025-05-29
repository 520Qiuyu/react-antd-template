import { AuthGuard } from '@/components';
import { theme } from '@/config/theme';
import Layout from '@/layout';
import { ReduxProvider } from '@/redux';
import Login from '@/views/login';
import { ConfigProvider, App as AntdApp } from 'antd';
import locale from 'antd/locale/zh_CN';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router';
import { TransitionProvider } from './components/TransitionComponent/transitionContext';
import ModalUtils from './utils/modal';

function App() {
  return (
    <ReduxProvider>
      <ConfigProvider locale={locale} theme={theme}>
        <AntdApp>
          <ModalUtils />
          <TransitionProvider>
            <HashRouter>
              <AuthGuard>
                <Routes>
                  {/* 登录 */}
                  <Route path='/login' element={<Login />} />
                  {/* 主体布局 */}
                  <Route path='/*' element={<Layout />} />
                </Routes>
              </AuthGuard>
            </HashRouter>
          </TransitionProvider>
        </AntdApp>
      </ConfigProvider>
    </ReduxProvider>
  );
}

export default App;
