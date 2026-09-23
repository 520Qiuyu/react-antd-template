import classNames from 'classnames';
import styles from './index.module.less';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** 真实图片地址，进入视口后再加载 */
  src?: string;
  /** 进入视口前的占位图 */
  placeholder?: string;
  /** IntersectionObserver root */
  root?: IntersectionObserverInit['root'];
  /** 提前加载距离，默认 200px */
  rootMargin?: string;
  /** 可见比例阈值 */
  threshold?: number | number[];
}

/**
 * IntersectionObserver 懒加载图片
 * @example
 * ```tsx
 * <LazyImage className={styles['cover']} src={cover} alt='封面' />
 * ```
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  className,
  placeholder,
  root,
  rootMargin = '200px 0px',
  threshold = 0.01,
  onLoad,
  onError,
  ...rest
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { root, rootMargin, threshold },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [inView, root, rootMargin, threshold]);

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (inView) setLoaded(true);
    onLoad?.(event);
  };

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    setLoaded(false);
    onError?.(event);
  };

  const currentSrc = inView && src ? src : placeholder;

  return (
    <img
      ref={imgRef}
      className={classNames(styles['lazyImage'], className, {
        [styles['isLoaded']]: loaded,
      })}
      src={currentSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
};

export default LazyImage;
