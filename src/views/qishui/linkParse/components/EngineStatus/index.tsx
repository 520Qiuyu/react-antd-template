import { useEmbedAudioMetadata } from '@/hooks';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import styles from './index.module.less';

/**
 * 音频处理引擎（ffmpeg-wasm）加载状态提示
 *
 * @description
 * 内部复用 useEmbedAudioMetadata。FFmpeg 实例与加载 promise 均为模块级单例，
 * 多处使用会共享同一次加载与同一引擎状态。加载 / 处理进度通过 progress（0–100）展示。
 */
const EngineStatus: React.FC = () => {
  const { status, loadStage, error, progress, loadFfmpeg } = useEmbedAudioMetadata();

  const banner = useMemo(() => {
    if (status === 'error') {
      return {
        tone: 'error' as const,
        icon: <CloseCircleFilled />,
        title: '音频处理引擎加载失败',
        desc: error?.message || '无法初始化 FFmpeg，下载将无法写入元信息',
        canRetry: true,
        showProgress: false,
      };
    }
    if (status === 'ready') {
      return {
        tone: 'ready' as const,
        icon: <CheckCircleFilled />,
        title: '音频处理引擎已就绪',
        desc: '下载时会自动写入封面、歌词等元信息',
        canRetry: false,
        showProgress: false,
      };
    }
    if (status === 'processing') {
      return {
        tone: 'loading' as const,
        icon: <LoadingOutlined spin />,
        title: '正在写入音频元信息…',
        desc: `${loadStage} ${progress}%`,
        canRetry: false,
        showProgress: true,
      };
    }
    return {
      tone: 'loading' as const,
      icon: <LoadingOutlined spin />,
      title: '正在准备音频处理引擎',
      desc:
        progress > 0
          ? `正在下载并初始化 FFmpeg Core… ${progress}%`
          : loadStage || '正在下载并初始化 FFmpeg Core…',
      canRetry: false,
      showProgress: true,
    };
  }, [status, loadStage, error, progress]);

  const handleRetry = () => {
    loadFfmpeg();
  };

  return (
    <div className={styles['engine']} data-tone={banner.tone}>
      <span className={styles['engineIcon']}>{banner.icon}</span>
      <div className={styles['engineBody']}>
        <span className={styles['engineTitle']}>{banner.title}</span>
        <span className={styles['engineDesc']}>{banner.desc}</span>
        {banner.showProgress ? (
          <div
            className={styles['engineProgress']}
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label='引擎加载进度'>
            <div
              className={styles['engineProgressFill']}
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
          </div>
        ) : null}
      </div>
      {banner.canRetry ? (
        <button type='button' className={styles['engineRetry']} onClick={handleRetry}>
          重试
        </button>
      ) : null}
    </div>
  );
};

export default EngineStatus;
