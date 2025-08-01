import {
  CaretRightOutlined,
  DownloadOutlined,
  HeartOutlined,
  MenuOutlined,
  PauseOutlined,
  RetweetOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { PlayMode, playNextSong, playPrevSong, setIsPlaying, setPlayMode } from '@/redux/modules/music';
import { Slider, Tag, Tooltip } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

export default function MusicPlayer() {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying, playList, playMode } = useAppSelector((state) => state.music);
  const [volume, setVolume] = useState(60);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tempTime, setTempTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mouseLeaveTimer, setMouseLeaveTimer] = useState<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // 播放/暂停
  const handlePlayPause = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!currentSong) return;
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      dispatch(setIsPlaying(!isPlaying));
    },
    [currentSong, isPlaying, dispatch],
  );

  // 上一首
  const handlePrevSong = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch(playPrevSong());
    },
    [dispatch],
  );

  // 下一首
  const handleNextSong = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch(playNextSong());
    },
    [dispatch],
  );

  // 切换播放模式
  const handleChangePlayMode = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const modeMap = {
        [PlayMode.SEQUENCE]: PlayMode.SINGLE_CYCLE,
        [PlayMode.SINGLE_CYCLE]: PlayMode.RANDOM,
        [PlayMode.RANDOM]: PlayMode.SEQUENCE,
      };
      dispatch(setPlayMode(modeMap[playMode]));
    },
    [dispatch, playMode],
  );

  // 获取播放模式图标和提示文字
  const getPlayModeIconAndText = useCallback(() => {
    switch (playMode) {
      case PlayMode.SEQUENCE:
        return {
          icon: <SwapOutlined className={styles['function-icon']} />,
          text: '顺序播放',
        };
      case PlayMode.SINGLE_CYCLE:
        return {
          icon: <RetweetOutlined className={styles['function-icon']} />,
          text: '单曲循环',
        };
      case PlayMode.RANDOM:
        return {
          icon: <RetweetOutlined className={styles['function-icon']} rotate={90} />,
          text: '随机播放',
        };
      default:
        return {
          icon: <SwapOutlined className={styles['function-icon']} />,
          text: '顺序播放',
        };
    }
  }, [playMode]);

  // 监听音频播放结束
  useEffect(() => {
    const handleEnded = () => {
      if (playMode === PlayMode.SINGLE_CYCLE) {
        // 单曲循环
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      } else {
        // 其他模式播放下一首
        dispatch(playNextSong());
      }
    };

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('ended', handleEnded);
      }
    };
  }, [dispatch, playMode]);

  // 音量改变
  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  }, []);

  // 格式化时间
  const formatTime = (time: number | undefined) => {
    if (typeof time !== 'number') return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 进度条拖动开始和拖动中
  const handleTimeChange = useCallback((value: number) => {
    setIsDragging(true);
    setTempTime(value);
  }, []);

  // 进度条拖动结束
  const handleTimeAfterChange = useCallback((value: number) => {
    setIsDragging(false);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  }, []);

  // 鼠标移入
  const handleMouseEnter = useCallback(() => {
    if (mouseLeaveTimer) {
      clearTimeout(mouseLeaveTimer);
      setMouseLeaveTimer(null);
    }
    setIsMinimized(false);
  }, [mouseLeaveTimer]);

  // 鼠标移出
  const handleMouseLeave = useCallback(() => {
    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 300);
    setMouseLeaveTimer(timer);
  }, []);

  // 监听音频更新
  useEffect(() => {
    if (!isDragging && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isDragging]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (mouseLeaveTimer) {
        clearTimeout(mouseLeaveTimer);
      }
    };
  }, [mouseLeaveTimer]);

  return (
    <div
      ref={playerRef}
      className={`${styles['music-player']} ${isMinimized ? styles['minimized'] : ''}`}
      style={
        {
          '--play-state': isPlaying ? 'running' : 'paused',
        } as React.CSSProperties
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={isMinimized ? handlePlayPause : undefined}>
      {/* 音频元素 */}
      <audio
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={() => !isDragging && setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      {/* 封面和信息 */}
      <div className={styles['info-section']}>
        <div className={styles['cover']}>
          <img src={currentSong?.album?.cover || 'default-cover.jpg'} alt={currentSong?.name} />
        </div>
        <div className={styles['song-info']}>
          <div className={styles['song-name']}>
            <span className={styles['name']}>{currentSong?.name || '未播放'}</span>
            {currentSong?.subtitle && (
              <Tag color='blue' className={styles['subtitle']}>
                {currentSong.subtitle}
              </Tag>
            )}
          </div>
          <div className={styles['song-meta']}>
            <span className={styles['artist']}>
              {currentSong?.singer?.map((s) => s.name).join(' / ') || '未知歌手'}
            </span>
            {currentSong?.album && (
              <>
                <span className={styles['divider']}>·</span>
                <span className={styles['album']} title={currentSong.album.name}>
                  {currentSong.album.name}
                </span>
                {currentSong.album.time_public && (
                  <Tag className={styles['time-tag']}>{currentSong.album.time_public}</Tag>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 控制区域 */}
      <div className={styles['control-section']}>
              <div className={styles['control-buttons']}>
        <StepBackwardOutlined className={styles['control-icon']} onClick={handlePrevSong} />
        <div className={styles['play-pause']} onClick={handlePlayPause}>
          {isPlaying ? (
            <PauseOutlined className={styles['control-icon']} />
          ) : (
            <CaretRightOutlined className={styles['control-icon']} />
          )}
        </div>
        <StepForwardOutlined className={styles['control-icon']} onClick={handleNextSong} />
      </div>
      <div className={styles['progress-bar']}>
        <span className={styles['time']}>{formatTime(isDragging ? tempTime : currentTime)}</span>
        <Slider
          value={isDragging ? tempTime : currentTime}
          min={0}
          max={duration}
          onChange={handleTimeChange}
          onAfterChange={handleTimeAfterChange}
          tooltip={{ formatter: formatTime }}
        />
        <span className={styles['time']}>{formatTime(duration)}</span>
      </div>
    </div>

    {/* 功能区域 */}
    <div className={styles['function-section']}>
      <div className={styles['volume-control']}>
        <SoundOutlined className={styles['function-icon']} />
        <Slider
          vertical
          value={volume}
          onChange={handleVolumeChange}
          className={styles['volume-slider']}
        />
      </div>
      <Tooltip title={getPlayModeIconAndText().text}>
        <div onClick={handleChangePlayMode}>{getPlayModeIconAndText().icon}</div>
      </Tooltip>
      <HeartOutlined className={styles['function-icon']} />
      <DownloadOutlined className={styles['function-icon']} />
      <MenuOutlined className={styles['function-icon']} />
    </div>
    </div>
  );
}
