import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import { downloadBlob, getDownloadProgress } from '@/utils/download';
import { msgError, msgSuccess } from '@/utils/modal';
import {
  CaretRightOutlined,
  DownloadOutlined,
  ExpandOutlined,
  LoadingOutlined,
  PauseOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { createContext, type ReactNode } from 'react';
import { buildSongFilename } from '../../downloadSong';
import { formatDuration } from '../../utils';
import styles from './index.module.less';

type PlayerPhase = 'idle' | 'preparing' | 'buffering' | 'playing' | 'paused' | 'error';
type DownloadPhase = 'idle' | 'downloading' | 'done';

interface VideoPlayerContextValue {
  data: MusicInfo;
  videoRef: (node: HTMLVideoElement | null) => void;
  playUrl?: QishuiUrl;
  phase: PlayerPhase;
  currentTime: number;
  duration: number;
  bufferRatio: number;
  prepareRatio: number;
  downloadPhase: DownloadPhase;
  downloadRatio: number;
  handleTogglePlay: () => Promise<void>;
  handleProgressClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleProgressKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  handleFullscreen: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

const useVideoPlayerContext = () => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) {
    throw new Error('VideoPlayer 子组件必须放在 VideoPlayer 内');
  }
  return ctx;
};

interface VideoPlayerProps {
  data: MusicInfo;
  onPlayingChange?: (playing: boolean) => void;
  children: ReactNode;
}

/**
 * 视频播放器根节点：封面位播画面，操作区放控制条。
 *
 * @example
 * <VideoPlayer data={data} onPlayingChange={setIsPlaying}>
 *   <VideoPlayer.Stage />
 *   <VideoPlayer.Bar />
 * </VideoPlayer>
 */
const VideoPlayer: React.FC<VideoPlayerProps> & {
  Stage: typeof VideoStage;
  Bar: typeof VideoBar;
} = ({ data, onPlayingChange, children }) => {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const onPlayingChangeRef = useRef(onPlayingChange);
  onPlayingChangeRef.current = onPlayingChange;
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferRatio, setBufferRatio] = useState(0);
  const [prepareRatio, setPrepareRatio] = useState(0);
  const [downloadPhase, setDownloadPhase] = useState<DownloadPhase>('idle');
  const [downloadRatio, setDownloadRatio] = useState(0);
  const objectUrlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const fetchPromiseRef = useRef<Promise<Blob> | null>(null);
  const prepareTokenRef = useRef(0);
  const mediaKeyRef = useRef('');

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node;
    setVideoEl(node);
  }, []);

  const playUrl = useMemo(
    () => data.urls?.find((item) => item.url) || data.urls?.[0],
    [data.urls],
  );
  const mediaKey = `${data.trackId || ''}::${playUrl?.url || ''}`;
  mediaKeyRef.current = mediaKey;

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const updateBufferRatio = useCallback(() => {
    const video = videoElRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      setBufferRatio(0);
      return;
    }

    let end = 0;
    for (let index = 0; index < video.buffered.length; index += 1) {
      end = Math.max(end, video.buffered.end(index));
    }
    setBufferRatio(Math.min(end / video.duration, 1));
  }, []);

  const ensureBlob = useCallback(async () => {
    if (blobRef.current) return blobRef.current;
    if (fetchPromiseRef.current) return fetchPromiseRef.current;
    if (!playUrl?.url) {
      throw new Error('暂无可下载视频');
    }

    const key = mediaKey;
    setPrepareRatio(0);
    setDownloadRatio(0);

    const promise = getDownloadProgress(playUrl.url, {
      onProgress: ({ receivedLength, contentLength }) => {
        if (mediaKeyRef.current !== key) return;
        if (!contentLength) return;
        const ratio = receivedLength / contentLength;
        setPrepareRatio(ratio);
        setDownloadRatio(ratio);
      },
    })
      .then((blob) => {
        fetchPromiseRef.current = null;
        if (mediaKeyRef.current !== key) {
          throw new Error('已切换视频');
        }
        const videoBlob = blob.type.includes('video')
          ? blob
          : new Blob([blob], { type: 'video/mp4' });
        blobRef.current = videoBlob;
        setPrepareRatio(1);
        setDownloadRatio(1);
        return videoBlob;
      })
      .catch((error) => {
        fetchPromiseRef.current = null;
        throw error;
      });

    fetchPromiseRef.current = promise;
    return promise;
  }, [mediaKey, playUrl?.url]);

  const prepareSource = useCallback(async () => {
    if (!playUrl?.url) {
      throw new Error('暂无可播放视频');
    }

    const token = prepareTokenRef.current + 1;
    prepareTokenRef.current = token;
    setPhase('preparing');
    setPrepareRatio(0);

    const blob = await ensureBlob();
    if (prepareTokenRef.current !== token) return '';

    revokeObjectUrl();
    objectUrlRef.current = URL.createObjectURL(blob);

    const video = videoElRef.current;
    if (!video) return '';
    video.src = objectUrlRef.current;
    video.load();
    return objectUrlRef.current;
  }, [ensureBlob, playUrl?.url, revokeObjectUrl]);

  const handleDownload = useCallback(async () => {
    if (!playUrl?.url) {
      msgError('暂无可下载视频');
      return;
    }
    if (downloadPhase === 'downloading') return;

    try {
      if (blobRef.current) {
        downloadBlob(blobRef.current, buildSongFilename(data, playUrl));
        setDownloadPhase('done');
        msgSuccess('视频已保存');
        return;
      }

      setDownloadPhase('downloading');
      setDownloadRatio(0);
      const blob = await ensureBlob();
      downloadBlob(blob, buildSongFilename(data, playUrl));
      setDownloadPhase('done');
      msgSuccess('视频已保存');
    } catch (error) {
      setDownloadPhase('idle');
      msgError(error instanceof Error ? error.message : '视频下载失败');
    }
  }, [data, downloadPhase, ensureBlob, playUrl]);

  const handleTogglePlay = useCallback(async () => {
    const video = videoElRef.current;
    if (!playUrl?.url) {
      msgError('暂无可播放视频');
      return;
    }
    if (!video) return;

    if (phase === 'preparing') return;
    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      if (!objectUrlRef.current || !video.src) {
        await prepareSource();
        if (!video.src) return;
      }
      await video.play();
    } catch (error) {
      console.error(error);
      setPhase('error');
      onPlayingChangeRef.current?.(false);
      msgError(error instanceof Error ? error.message : '视频播放失败');
    }
  }, [phase, playUrl?.url, prepareSource]);

  const handleSeek = useCallback((clientX: number, trackElement: HTMLDivElement) => {
    const video = videoElRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const rect = trackElement.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    video.currentTime = ratio * video.duration;
    setCurrentTime(video.currentTime);
    updateBufferRatio();
  }, [updateBufferRatio]);

  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (phase === 'preparing') return;
      handleSeek(event.clientX, event.currentTarget);
    },
    [handleSeek, phase],
  );

  const handleProgressKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const video = videoElRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

      const step = event.shiftKey ? 10 : 5;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        video.currentTime = Math.min(video.currentTime + step, video.duration);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        video.currentTime = Math.max(video.currentTime - step, 0);
      }
    },
    [],
  );

  const handleFullscreen = useCallback(async () => {
    const video = videoElRef.current;
    if (!video) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await video.requestFullscreen();
    } catch (error) {
      console.error(error);
      msgError('无法进入全屏');
    }
  }, []);

  useEffect(() => {
    if (!videoEl) return;

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration || 0);
      updateBufferRatio();
    };
    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
      updateBufferRatio();
    };
    const handlePlaying = () => {
      setPhase('playing');
      onPlayingChangeRef.current?.(true);
    };
    const handlePause = () => {
      if (videoEl.ended) return;
      setPhase('paused');
      onPlayingChangeRef.current?.(false);
    };
    const handleWaiting = () => {
      setPhase((prev) => (prev === 'playing' || prev === 'buffering' ? 'buffering' : prev));
    };
    const handleEnded = () => {
      setPhase('idle');
      setCurrentTime(0);
      onPlayingChangeRef.current?.(false);
    };
    const handleError = () => {
      setPhase('error');
      onPlayingChangeRef.current?.(false);
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('progress', updateBufferRatio);
    videoEl.addEventListener('playing', handlePlaying);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('waiting', handleWaiting);
    videoEl.addEventListener('ended', handleEnded);
    videoEl.addEventListener('error', handleError);

    return () => {
      prepareTokenRef.current += 1;
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('progress', updateBufferRatio);
      videoEl.removeEventListener('playing', handlePlaying);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('waiting', handleWaiting);
      videoEl.removeEventListener('ended', handleEnded);
      videoEl.removeEventListener('error', handleError);
      revokeObjectUrl();
    };
  }, [revokeObjectUrl, updateBufferRatio, videoEl]);

  const prevMediaKeyRef = useRef(mediaKey);
  useEffect(() => {
    if (prevMediaKeyRef.current === mediaKey) return;
    prevMediaKeyRef.current = mediaKey;
    prepareTokenRef.current += 1;
    const video = videoElRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    revokeObjectUrl();
    blobRef.current = null;
    fetchPromiseRef.current = null;
    setPhase('idle');
    setCurrentTime(0);
    setDuration(0);
    setBufferRatio(0);
    setPrepareRatio(0);
    setDownloadPhase('idle');
    setDownloadRatio(0);
    onPlayingChangeRef.current?.(false);
  }, [mediaKey, revokeObjectUrl]);

  useEffect(() => {
    return () => {
      blobRef.current = null;
      fetchPromiseRef.current = null;
    };
  }, []);

  const value = useMemo<VideoPlayerContextValue>(
    () => ({
      data,
      videoRef,
      playUrl,
      phase,
      currentTime,
      duration,
      bufferRatio,
      prepareRatio,
      downloadPhase,
      downloadRatio,
      handleTogglePlay,
      handleProgressClick,
      handleProgressKeyDown,
      handleFullscreen,
      handleDownload,
    }),
    [
      bufferRatio,
      currentTime,
      data,
      downloadPhase,
      downloadRatio,
      duration,
      handleDownload,
      handleFullscreen,
      handleProgressClick,
      handleProgressKeyDown,
      handleTogglePlay,
      phase,
      playUrl,
      prepareRatio,
    ],
  );

  return <VideoPlayerContext.Provider value={value}>{children}</VideoPlayerContext.Provider>;
};

/** 竖屏画面：封面作海报，点击中央按钮开播 */
const VideoStage: React.FC = () => {
  const { data, videoRef, playUrl, phase, handleTogglePlay } = useVideoPlayerContext();
  const isPlaying = phase === 'playing';
  const isBusy = phase === 'preparing' || phase === 'buffering';

  return (
    <div
      className={classNames(styles['stage'], {
        [styles['stagePlaying']]: isPlaying,
      })}>
      <video
        ref={videoRef}
        className={styles['video']}
        poster={data.cover}
        playsInline
        preload='none'
        aria-label={data.title || '视频预览'}
        onClick={handleTogglePlay}
      />
      <div className={styles['stageShade']} aria-hidden='true' />
      {playUrl?.url ? (
        <button
          className={classNames(styles['stagePlay'], {
            [styles['stagePlayHidden']]: isPlaying,
          })}
          type='button'
          aria-label={isPlaying ? '暂停视频' : '播放视频'}
          onClick={(event) => {
            event.stopPropagation();
            handleTogglePlay();
          }}>
          {isBusy ? <LoadingOutlined spin /> : isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
        </button>
      ) : (
        <span className={styles['stageEmpty']}>暂无视频地址</span>
      )}
      {isPlaying ? (
        <span className={styles['liveBadge']} aria-hidden='true'>
          <i />
          播放中
        </span>
      ) : null}
    </div>
  );
};

/** 底部控制条：播放 / 进度 / 全屏 / 下载 */
const VideoBar: React.FC = () => {
  const {
    playUrl,
    phase,
    currentTime,
    duration,
    bufferRatio,
    prepareRatio,
    downloadPhase,
    downloadRatio,
    handleTogglePlay,
    handleProgressClick,
    handleProgressKeyDown,
    handleFullscreen,
    handleDownload,
  } = useVideoPlayerContext();

  const isBusy = phase === 'preparing' || phase === 'buffering';
  const isPlaying = phase === 'playing';
  const playedRatio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const statusText = useMemo(() => {
    if (phase === 'preparing') {
      return prepareRatio > 0 ? `加载中 ${Math.round(prepareRatio * 100)}%` : '加载中…';
    }
    if (phase === 'buffering') return '缓冲中…';
    if (phase === 'paused') return '已暂停';
    if (phase === 'error') return '无法播放';
    if (phase === 'playing') return '正在播放';
    return '点击播放视频';
  }, [phase, prepareRatio]);

  if (!playUrl?.url) {
    return <div className={styles['empty']}>解析到视频地址后可在此预览</div>;
  }

  return (
    <div className={styles['barWrap']}>
      <div className={styles['bar']} aria-label='视频播放器'>
        <button
          className={classNames(styles['playBtn'], { [styles['playBtnBusy']]: isBusy })}
          type='button'
          aria-label={isPlaying ? '暂停' : '播放'}
          disabled={phase === 'preparing'}
          onClick={handleTogglePlay}>
          {isBusy ? <LoadingOutlined spin /> : isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
        </button>

        <div className={styles['main']}>
          <div
            className={styles['progressTrack']}
            role='slider'
            tabIndex={0}
            aria-label='播放进度'
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatDuration(currentTime)} / ${formatDuration(duration)}`}
            onClick={handleProgressClick}
            onKeyDown={handleProgressKeyDown}>
            {phase === 'preparing' ? (
              prepareRatio > 0 ? (
                <div
                  className={styles['progressPlayed']}
                  style={{ width: `${prepareRatio * 100}%` }}
                />
              ) : (
                <div className={styles['progressPreparing']} />
              )
            ) : (
              <>
                <div className={styles['progressBuffer']} style={{ width: `${bufferRatio * 100}%` }} />
                <div className={styles['progressPlayed']} style={{ width: `${playedRatio * 100}%` }} />
                {duration > 0 ? (
                  <span className={styles['progressThumb']} style={{ left: `${playedRatio * 100}%` }} />
                ) : null}
              </>
            )}
          </div>

          <div className={styles['metaRow']}>
            <span className={styles['time']}>
              <span>{formatDuration(currentTime)}</span>
              <span className={styles['timeSep']}>/</span>
              <span>{formatDuration(duration)}</span>
            </span>
            <div className={styles['statusWrap']}>
              {isBusy ? <span className={styles['statusDot']} aria-hidden='true' /> : null}
              <span
                className={classNames(styles['statusText'], {
                  [styles['statusTextBusy']]: isBusy || isPlaying,
                })}>
                {statusText}
              </span>
            </div>
          </div>
        </div>

        <button
          className={styles['fullBtn']}
          type='button'
          aria-label='全屏播放'
          onClick={handleFullscreen}>
          <ExpandOutlined />
        </button>
      </div>

      <button
        className={styles['downloadBtn']}
        type='button'
        aria-label='下载原视频'
        disabled={!playUrl?.url || downloadPhase === 'downloading'}
        onClick={handleDownload}>
        {downloadPhase === 'downloading' ? <LoadingOutlined spin /> : <DownloadOutlined />}
        {downloadPhase === 'downloading'
          ? downloadRatio > 0
            ? `下载中 ${Math.round(downloadRatio * 100)}%`
            : '下载中...'
          : downloadPhase === 'done'
            ? '再次下载'
            : '下载原视频'}
      </button>
    </div>
  );
};

VideoPlayer.Stage = VideoStage;
VideoPlayer.Bar = VideoBar;

export default VideoPlayer;
