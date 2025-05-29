import { reqGetAuthList } from '@/apis';
import { getLocalToken, getLocalUserInfo } from './userInfo';
import { redirect, UNSAFE_createBrowserHistory } from 'react-router';
import { config } from '@/config';

const history = UNSAFE_createBrowserHistory();

export const goToLogin = () => {
  console.log('去登录页');
  if (config.casLogin) {
    console.log(
      `${window.casLoginUrl}?service=${
        window.location.origin + window.location.pathname + window.location.hash
      }`,
    );
    window.location.href = `${window.casLoginUrl}?service=${encodeURIComponent(
      window.location.origin + window.location.pathname + window.location.hash,
    )}`;
  } else {
    history.push('/login');
  }
};
export const goToLogout = () => {
  console.log('去登出页');
  if (config.casLogin) {
    console.log(
      `${window.casLogoutUrl}?service=${
        window.location.origin + window.location.pathname + window.location.hash
      }`,
    );
    window.location.href = `${window.casLogoutUrl}?service=${encodeURIComponent(
      window.location.origin + window.location.pathname + window.location.hash,
    )}`;
  }
};
