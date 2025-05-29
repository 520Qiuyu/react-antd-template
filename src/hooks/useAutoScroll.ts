import { useEffect, useRef } from 'react';

interface IScrollToOptions {
  /** 滚动频率 */
  frequency?: number;
  /** 滚动距离 */
  scrollDistance?: number;
  /** 滚动到底部之后，间隔多少时间滚动到顶部 */
  backTopTime?: number;
  /** 开始滚动时间 */
  startScrollTime?: number;
  /** 子元素选择器 */
  childQuerySelector?: string;
}

export const useAutoScroll = (options: IScrollToOptions = {}) => {
  /** 滚动容器 */
  const containerRef = useRef<HTMLElement | null>(null);
  /** 开始滚动计时器id */
  const startScrollId = useRef<any>(null);
  /** 回到顶部计时器id */
  const backTopId = useRef<any>(null);
  /** 滚动计时器id */
  const timeId = useRef<any>(null);
  const {
    frequency = 1000,
    scrollDistance = 10,
    backTopTime = 0,
    startScrollTime = 0,
    childQuerySelector,
  } = options;

  const startScroll = () => {
    clearTimeout(startScrollId.current);

    const el = childQuerySelector
      ? document.querySelector(childQuerySelector)
      : containerRef.current;
    if (!el) {
      console.warn('该容器不存在');
      return;
    }

    startScrollId.current = setTimeout(() => {
      const { clientHeight, scrollHeight } = el;
      if (scrollHeight > clientHeight) {
        const setScrollTop = () => {
          timeId.current = setTimeout(() => {
            // 判断下次滚动是否滚动到底部
            if (el.scrollTop + scrollDistance >= scrollHeight - clientHeight) {
              el.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth',
              });

              backTopId.current = setTimeout(() => {
                el.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
                setTimeout(setScrollTop, startScrollTime);
              }, backTopTime);
            }
            // 下次滚动不到底部
            else {
              el.scrollTo({
                top: el.scrollTop + scrollDistance,
                behavior: 'smooth',
              });
              setScrollTop();
            }
            console.log('el.scrollTop', el.scrollTop);
          }, frequency);
        };
        setScrollTop();
      } else {
        console.warn('该容器不能滚动');
      }
    }, startScrollTime);
  };

  const stopScroll = () => {
    clearTimeout(startScrollId.current);
    clearTimeout(backTopId.current);
    clearTimeout(timeId.current);
  };

  useEffect(() => {
    const el = childQuerySelector
      ? document.querySelector(childQuerySelector)
      : containerRef.current;

    if (el) {
      startScroll();
      el.addEventListener('mouseenter', stopScroll);
      el.addEventListener('mouseleave', startScroll);
    }

    return () => {
      stopScroll();
      if (el) {
        el.removeEventListener('mouseenter', stopScroll);
        el.removeEventListener('mouseleave', startScroll);
      }
    };
  }, [options]);

  return containerRef;
};
