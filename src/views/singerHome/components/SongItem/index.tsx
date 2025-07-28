import { getMusicPlay } from '@/apis/qqMusic/singer';
import { useAppDispatch } from '@/hooks';
import { addToPlayListAsync, setCurrentSong } from '@/redux/modules/music';
import { downloadWithFileName } from '@/utils/download';
import { DownloadOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Tag, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import styles from './index.module.less';

const { Text } = Typography;

export interface Singer {
  /** 歌手id */
  id: number;
  /** 歌手mid */
  mid: string;
  /** 歌手名称 */
  name: string;
}

export interface Album {
  /** 专辑id */
  mid: string;
  /** 专辑名称 */
  name: string;
  /** 发行时间 */
  time_public?: string;
}

export interface Song {
  /** 歌曲id */
  id: number;
  /** 歌曲id */
  mid: string;
  /** 歌曲名称 */
  name: string;
  /** 歌曲描述 */
  subtitle?: string;
  /** 歌曲时长 */
  interval: number;
  /** 专辑描述 */
  album?: Album;
  /** 歌手 */
  singer?: Singer[];
}

interface SongItemProps {
  song: Song;
  index: number;
  active?: boolean;
  onClick?: () => void;
}

export default function SongItem({ song, index, active, onClick }: SongItemProps) {
  const dispatch = useAppDispatch();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (e: React.MouseEvent) => {
    console.log('song', song);
    e.stopPropagation();
    try {
      const newSong = await dispatch(addToPlayListAsync(song));
      dispatch(setCurrentSong(newSong));
    } catch (error) {
      console.log('play', error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('download', song);
    try {
      const res: any = await getMusicPlay({ songmid: song.mid });
      console.log('res', res);
      const urlInfo = res.data.playUrl[song.mid];
      if (!urlInfo.error) {
        downloadWithFileName(urlInfo.url, song.name);
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleAddToPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('add to playlist', song);
    console.log('song', song);
    e.stopPropagation();
    try {
      dispatch(addToPlayListAsync(song));
    } catch (error) {
      console.log('play', error);
    }
  };

  return (
    <div
      className={classNames(styles['song-item'], {
        [styles.active]: active,
      })}
      onClick={onClick}>
      <div className={styles['song-index']}>{index + 1}</div>
      <div className={styles['song-info']}>
        <div className={styles['song-name']}>
          <Text>{song.name}</Text>
          {song.subtitle && <Tag color='blue'>{song.subtitle}</Tag>}
        </div>
        <div className={styles['song-meta']}>
          <Text type='secondary'>{song.singer?.map((s) => s.name).join(' / ')}</Text>
          <Text type='secondary'>· {formatTime(song.interval)}</Text>
          {song.album && (
            <>
              <Text type='secondary'>· {song.album.name}</Text>
              {song.album.time_public && <Text type='secondary'>· {song.album.time_public}</Text>}
            </>
          )}
        </div>
      </div>
      <div className={styles['operation-icons']}>
        <Tooltip title='播放'>
          <div className={styles['icon-wrapper']}>
            <PlayCircleOutlined className={styles['play-icon']} onClick={handlePlay} />
          </div>
        </Tooltip>
        <Tooltip title='下载'>
          <div className={styles['icon-wrapper']}>
            <DownloadOutlined onClick={handleDownload} />
          </div>
        </Tooltip>
        <Tooltip title='添加到播放列表'>
          <div className={styles['icon-wrapper']}>
            <PlusOutlined onClick={handleAddToPlaylist} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
