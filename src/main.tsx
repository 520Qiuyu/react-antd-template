import 'assets/styles/global.less';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { config } from '@/config';

dayjs.locale('zh-cn');

//设置默认的前缀
window.baseUrl = config.baseUrl;
window.casLogoutUrl = import.meta.env.VITE_CAS_LOGOUT_URL;
window.casLoginUrl = import.meta.env.VITE_CAS_LOGIN_URL;
window.casStatus = true;
document.title = config.title;

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
);
