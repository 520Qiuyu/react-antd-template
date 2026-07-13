import { AuthGuard } from '@/components';
import { theme } from '@/config/theme';
import Layout from '@/layout';
import { App as AntdApp, ConfigProvider } from 'antd';
import locale from 'antd/locale/zh_CN';
import { Route, Routes } from 'react-router';
import { TransitionProvider } from './components/TransitionComponent/transitionContext';
import eventBus from './utils/eventBus';
import ModalUtils from './utils/modal';

function App() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  // 监听401事件
  useEffect(() => {
    eventBus.on('401', () => {
      const callbackUrl = `${pathname}${search}`;
      console.log('callbackUrl',callbackUrl)
      navigate(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
        replace: true,
      });
    });

    return () => {
      eventBus.offAll('401');
    };
  }, []);

  return (
    <ConfigProvider locale={locale} theme={theme}>
      <AntdApp>
        <ModalUtils />
        <TransitionProvider>
          <AuthGuard>
            <Routes>
              {/* 主体布局 */}
              <Route path='/*' element={<Layout />} />
            </Routes>
          </AuthGuard>
        </TransitionProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
