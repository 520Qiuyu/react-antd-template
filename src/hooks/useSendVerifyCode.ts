import { useLocalStorageState, useMount } from 'ahooks';
import { useState } from 'react';
import { useLocation } from 'react-router';

export const useSendVerifyCode = () => {
  const { pathname } = useLocation();

  /** 倒计时时长 */
  const COUNT_DOWN_TIME = 60;
  // 开始时间
  const [startTime, setStartTime] = useLocalStorageState<number>(pathname + 'startTime', {
    defaultValue: 0,
  });
  // 已计时
  const [countDown, setCountDown] = useState(
    startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
  );
  /** 计时器id */
  let timer: any;

  useMount(() => {
    // 存在记录，直接开始计时
    startTime && interval();
  });

  /** 开始计时 */
  const startCountDown = () => {
    if (countDown > 0) return;
    interval();
  };

  /** 清除开始时间 */
  function clearStartTime() {
    localStorage.removeItem(pathname + 'startTime');
  }

  /** 初始化的时候查看是否计时完成，未完成则计时直接输 */
  function interval() {
    startTime || setStartTime(Date.now());
    setCountDown((countDown) => countDown + 1);
    clearInterval(timer);
    timer = setInterval(() => {
      setCountDown((countDown) => {
        const newCountDown = countDown + 1;
        if (newCountDown >= COUNT_DOWN_TIME) {
          clearInterval(timer);
          clearStartTime();
          setCountDown(0);
        }
        return newCountDown;
      });
    }, 1000);
  }

  return {
    /** 已计时 */
    countDown,
    /** 倒计时时长 */
    COUNT_DOWN_TIME,
    /** 开始计时 */
    startCountDown,
  };
};
