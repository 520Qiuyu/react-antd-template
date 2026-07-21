import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import { getDownloadProgress } from '@/utils/download';
import { msgError } from '@/utils/modal';
import {
  CaretRightOutlined,
  LoadingOutlined,
  PauseOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { SodaAudioDecryptor } from '../../../../../utils/sodaDecryptor';
import { formatDuration, qualityLabel } from '../../utils';
import styles from './index.module.less';

type PlayerPhase = 'idle' | 'preparing' | 'buffering' | 'playing' | 'paused' | 'error';

interface SongPlayerProps {
  data: MusicInfo;
  onPlayingChange?: (playing: boolean) => void;
}

const PLAY_QUALITY_ORDER = ['higher', 'standard', 'hq', 'lossless'] as const;

/**
 * 选取优先播放的音质地址
 */
const pickPlayUrl = (urls: QishuiUrl[] = []) => {
  for (const quality of PLAY_QUALITY_ORDER) {
    const matched = urls.find((item) => item.quality === quality && item.url);
    if (matched) return matched;
  }
  return urls.find((item) => item.url);
};

/**
 * 歌曲卡片播放器
 */
const SongPlayer: React.FC<SongPlayerProps> = ({ data, onPlayingChange }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const prepareTokenRef = useRef(0);

  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferRatio, setBufferRatio] = useState(0);
  const [prepareRatio, setPrepareRatio] = useState(0);

  const playUrl = useMemo(() => pickPlayUrl(data.urls), [data.urls]);
  const isBusy = phase === 'preparing' || phase === 'buffering';
  const isPlaying = phase === 'playing';
  const playedRatio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const resetPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    revokeObjectUrl();
    setPhase('idle');
    setCurrentTime(0);
    setDuration(0);
    setBufferRatio(0);
    setPrepareRatio(0);
    onPlayingChange?.(false);
  }, [onPlayingChange, revokeObjectUrl]);

  const updateBufferRatio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      setBufferRatio(0);
      return;
    }

    let end = 0;
    for (let index = 0; index < audio.buffered.length; index += 1) {
      end = Math.max(end, audio.buffered.end(index));
    }
    setBufferRatio(Math.min(end / audio.duration, 1));
  }, []);

  const prepareSource = useCallback(async () => {
    if (!playUrl?.url) {
      throw new Error('暂无可播放音质');
    }

    const token = prepareTokenRef.current + 1;
    prepareTokenRef.current = token;
    setPhase('preparing');
    setPrepareRatio(0);

    let source = playUrl.url;

    if (playUrl.playAuth) {
      const blob = await getDownloadProgress(playUrl.url, {
        onProgress: ({ receivedLength, contentLength }) => {
          if (prepareTokenRef.current !== token) return;
          if (!contentLength) return;
          setPrepareRatio(receivedLength / contentLength);
        },
      });

      if (prepareTokenRef.current !== token) return '';

      const { blob: decryptedBlob, decrypted, reason } = await SodaAudioDecryptor.decryptBlob(
        blob,
        playUrl.playAuth,
      );

      if (!decrypted) {
        throw new Error(reason || '音频解密失败');
      }

      revokeObjectUrl();
      objectUrlRef.current = URL.createObjectURL(decryptedBlob);
      source = objectUrlRef.current;
    }

    if (prepareTokenRef.current !== token) return '';

    const audio = audioRef.current;
    if (!audio) return '';

    audio.src = source;
    audio.load();
    return source;
  }, [playUrl, revokeObjectUrl]);

  const handleTogglePlay = async () => {
    if (!playUrl?.url) {
      msgError('暂无可播放音质');
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (phase === 'playing') {
      audio.pause();
      return;
    }

    try {
      if (!audio.src) {
        await prepareSource();
        if (!audio.src) return;
      }
      await audio.play();
    } catch (error) {
      console.error(error);
      setPhase('error');
      onPlayingChange?.(false);
      msgError(error instanceof Error ? error.message : '播放失败');
    }
  };

  const handleSeek = (clientX: number, trackElement: HTMLDivElement) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;

    const rect = trackElement.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
    updateBufferRatio();
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (phase === 'preparing') return;
    handleSeek(event.clientX, event.currentTarget);
  };

  const handleProgressKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;

    const step = event.shiftKey ? 10 : 5;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      audio.currentTime = Math.min(audio.currentTime + step, audio.duration);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      audio.currentTime = Math.max(audio.currentTime - step, 0);
    }
  };

  const statusText = useMemo(() => {
    if (phase === 'preparing') {
      return playUrl?.playAuth
        ? prepareRatio > 0
          ? `解密准备 ${Math.round(prepareRatio * 100)}%`
          : '解密准备中…'
        : '加载中…';
    }
    if (phase === 'buffering') return '缓冲中…';
    if (phase === 'paused') return '已暂停';
    if (phase === 'error') return '无法播放';
    if (phase === 'playing') return '正在播放';
    return '点击播放';
  }, [phase, playUrl?.playAuth, prepareRatio]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      updateBufferRatio();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateBufferRatio();
    };

    const handleProgress = () => updateBufferRatio();

    const handlePlaying = () => {
      setPhase('playing');
      onPlayingChange?.(true);
    };

    const handlePause = () => {
      if (audio.ended) return;
      setPhase((prev) => (prev === 'preparing' ? prev : 'paused'));
      onPlayingChange?.(false);
    };

    const handleWaiting = () => {
      setPhase((prev) => (prev === 'playing' || prev === 'buffering' ? 'buffering' : prev));
    };

    const handleEnded = () => {
      setPhase('idle');
      setCurrentTime(0);
      onPlayingChange?.(false);
    };

    const handleError = () => {
      setPhase('error');
      onPlayingChange?.(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      prepareTokenRef.current += 1;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
      revokeObjectUrl();
    };
  }, [onPlayingChange, revokeObjectUrl, updateBufferRatio]);

  useEffect(() => {
    prepareTokenRef.current += 1;
    resetPlayback();
  }, [data.trackId, playUrl?.url, resetPlayback]);

  if (!playUrl?.url) {
    return <div className={styles['empty']}>解析到音质地址后可在此试听</div>;
  }

  return (
    <div className={styles['player']} aria-label='歌曲播放器'>
      <button
        className={classNames(styles['playBtn'], { [styles['playBtnBusy']]: isBusy })}
        type='button'
        aria-label={isPlaying ? '暂停' : '播放'}
        disabled={phase === 'preparing'}
        onClick={handleTogglePlay}>
        {phase === 'preparing' || phase === 'buffering' ? (
          <LoadingOutlined spin />
        ) : isPlaying ? (
          <PauseOutlined />
        ) : (
          <CaretRightOutlined />
        )}
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
            <div className={styles['progressPreparing']} />
          ) : (
            <>
              <div
                className={styles['progressBuffer']}
                style={{ width: `${bufferRatio * 100}%` }}
              />
              <div
                className={styles['progressPlayed']}
                style={{ width: `${playedRatio * 100}%` }}
              />
              {duration > 0 ? (
                <span
                  className={styles['progressThumb']}
                  style={{ left: `${playedRatio * 100}%` }}
                />
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
            {playUrl.quality ? (
              <span className={styles['qualityTag']}>{qualityLabel(playUrl.quality)}</span>
            ) : null}
            {isBusy ? <span className={styles['statusDot']} aria-hidden='true' /> : null}
            <span
              className={classNames(styles['statusText'], {
                [styles['statusTextBusy']]: isBusy,
              })}>
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongPlayer;
