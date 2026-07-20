import { useEmbedAudioMetadata } from '@/hooks';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import styles from './index.module.less';

/**
 * 音频处理引擎（ffmpeg-wasm）加载状态提示
 *
 * @description
 * 内部复用 useEmbedAudioMetadata。FFmpeg 实例与加载 promise 均为模块级单例，
 * 多处使用会共享同一次加载与同一引擎状态。
 */
const EngineStatus: React.FC = () => {
  const { status, loadStage, error, loadFfmpeg } = useEmbedAudioMetadata();

  const banner = useMemo(() => {
    if (status === 'error') {
      return {
        tone: 'error' as const,
        icon: <CloseCircleFilled />,
        title: '音频处理引擎加载失败',
        desc: error?.message || '无法初始化 FFmpeg，下载将无法写入元信息',
        canRetry: true,
      };
    }
    if (status === 'ready') {
      return {
        tone: 'ready' as const,
        icon: <CheckCircleFilled />,
        title: '音频处理引擎已就绪',
        desc: '下载时会自动写入封面、歌词等元信息',
        canRetry: false,
      };
    }
    if (status === 'processing') {
      return {
        tone: 'loading' as const,
        icon: <LoadingOutlined spin />,
        title: '正在写入音频元信息…',
        desc: loadStage,
        canRetry: false,
      };
    }
    return {
      tone: 'loading' as const,
      icon: <LoadingOutlined spin />,
      title: '正在准备音频处理引擎',
      desc: loadStage || '正在下载并初始化 FFmpeg Core…',
      canRetry: false,
    };
  }, [status, loadStage, error]);

  return (
    <div className={styles['engine']} data-tone={banner.tone}>
      <span className={styles['engineIcon']}>{banner.icon}</span>
      <div className={styles['engineBody']}>
        <span className={styles['engineTitle']}>{banner.title}</span>
        <span className={styles['engineDesc']}>{banner.desc}</span>
      </div>
      {banner.canRetry ? (
        <button type='button' className={styles['engineRetry']} onClick={() => loadFfmpeg()}>
          重试
        </button>
      ) : null}
    </div>
  );
};

export default EngineStatus;
