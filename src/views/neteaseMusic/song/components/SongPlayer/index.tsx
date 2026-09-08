import type { NeteaseSongDownloadData, ParseNeteaseSongUrl } from '@/types/netease';
import { msgError } from '@/utils/modal';
import { CaretRightOutlined, LoadingOutlined, PauseOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { formatDuration, qualityLabel, toHttpsUrl } from '../../../utils';
import styles from './index.module.less';

type PlayerPhase = 'idle' | 'preparing' | 'buffering' | 'playing' | 'paused' | 'error';

type PlayableSource = {
  url: string;
  level?: string | null;
};

interface SongPlayerProps {
  songId?: number;
  initialDownload?: ParseNeteaseSongUrl | null;
  downloads: Record<string, NeteaseSongDownloadData>;
  onPlayingChange?: (playing: boolean) => void;
}

/** 试听优先中高音质，体积更小、起播更快 */
const PLAY_QUALITY_ORDER = ['exhigh', 'higher', 'standard', 'lossless', 'hires'] as const;

/**
 * 从已解析音质里选出可试听地址
 * @example
 * pickPlayUrl(downloads, result.download)
 */
const pickPlayUrl = (
  downloads: Record<string, NeteaseSongDownloadData>,
  initial?: ParseNeteaseSongUrl | null,
): PlayableSource | undefined => {
  const items: PlayableSource[] = [];

  if (initial?.url) {
    items.push({
      url: toHttpsUrl(initial.url) || initial.url,
      level: initial.level,
    });
  }

  Object.values(downloads).forEach((item) => {
    if (!item.url) return;
    items.push({
      url: toHttpsUrl(item.url) || item.url,
      level: item.level,
    });
  });

  for (const quality of PLAY_QUALITY_ORDER) {
    const matched = items.find((item) => item.level === quality);
    if (matched) return matched;
  }

  return items[0];
};

/**
 * 网易云单曲卡片播放器（仅音频试听）
 * @example
 * ```tsx
 * <SongPlayer songId={song.id} downloads={downloads} onPlayingChange={setIsPlaying} />
 * ```
 */
const SongPlayer: React.FC<SongPlayerProps> = ({
  songId,
  initialDownload,
  downloads,
  onPlayingChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prepareTokenRef = useRef(0);

  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferRatio, setBufferRatio] = useState(0);

  const playUrl = useMemo(
    () => pickPlayUrl(downloads, initialDownload),
    [downloads, initialDownload],
  );
  const isBusy = phase === 'preparing' || phase === 'buffering';
  const isPlaying = phase === 'playing';
  const playedRatio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const resetPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setPhase('idle');
    setCurrentTime(0);
    setDuration(0);
    setBufferRatio(0);
    onPlayingChange?.(false);
  }, [onPlayingChange]);

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

    const audio = audioRef.current;
    if (!audio) return '';

    audio.src = playUrl.url;
    audio.load();
    return playUrl.url;
  }, [playUrl]);

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
    if (phase === 'preparing') return '加载中…';
    if (phase === 'buffering') return '缓冲中…';
    if (phase === 'paused') return '已暂停';
    if (phase === 'error') return '无法播放';
    if (phase === 'playing') return '正在播放';
    return '点击播放';
  }, [phase]);

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
    };
  }, [onPlayingChange, updateBufferRatio]);

  useEffect(() => {
    prepareTokenRef.current += 1;
    resetPlayback();
  }, [songId, playUrl?.url, resetPlayback]);

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
              <div className={styles['progressBuffer']} style={{ width: `${bufferRatio * 100}%` }} />
              <div className={styles['progressPlayed']} style={{ width: `${playedRatio * 100}%` }} />
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
            {playUrl.level ? (
              <span className={styles['qualityTag']}>{qualityLabel(playUrl.level)}</span>
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
