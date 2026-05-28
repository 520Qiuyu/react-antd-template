import 'assets/styles/global.less';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App.tsx';

dayjs.locale('zh-cn');



createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
