import { useEmbedAudioMetadata } from '@/hooks';
import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import copy from '@/utils/copy';
import { msgError, msgSuccess } from '@/utils/modal';
import {
  CheckOutlined,
  CopyOutlined,
  DownloadOutlined,
  LoadingOutlined,
  SaveOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { downloadSongAudio, downloadSongLyric } from '../../downloadSong';
import { formatSize, qualityLabel } from '../../utils';
import EngineStatus from '../EngineStatus';
import SongPlayer from '../SongPlayer';
import VideoPlayer from '../VideoPlayer';
import styles from './index.module.less';

interface SongCardProps {
  data: MusicInfo;
}

/** 歌曲信息卡片 */
export const SongCard: React.FC<SongCardProps> = ({ data }) => {
  const [copyIdDone, setCopyIdDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const avatar = data.artists?.[0]?.avatar;

  const handleCopyId = async () => {
    if (!data.trackId) return;
    try {
      await copy(data.trackId);
      setCopyIdDone(true);
      msgSuccess('已复制歌曲 ID');
      setTimeout(() => setCopyIdDone(false), 1400);
    } catch (error) {
      console.log('error', error);
    }
  };

  const isVideo = data.type === 'video';

  const card = (
    <article
      className={classNames(styles['songCard'], {
        [styles['songCardVideo']]: isVideo,
      })}>
      <div
        className={classNames(styles['coverWrap'], {
          [styles['coverWrapPlaying']]: isPlaying,
        })}>
        <div className={styles['coverGlow']} aria-hidden='true' />
        {isVideo ? (
          <VideoPlayer.Stage />
        ) : (
          <img className={styles['cover']} src={data.cover} alt='专辑封面' />
        )}
      </div>
      <div className={styles['meta']}>
        {isVideo ? (
          <span className={styles['videoTag']} aria-label='视频'>
            <VideoCameraOutlined />
            视频
          </span>
        ) : (
          <span className={styles['album']}>{data.album || '未知专辑'}</span>
        )}
        <h3 className={styles['title']} title={data.title || '未知歌曲'}>
          {data.title || '未知歌曲'}
        </h3>
        <div className={styles['artist']}>
          {avatar ? <img className={styles['avatar']} src={avatar} alt='' /> : null}
          <span>{data.artist || '未知歌手'}</span>
        </div>
        <code className={styles['trackId']}>
          {data.trackId || '—'}{' '}
          {copyIdDone ? (
            <CheckOutlined onClick={handleCopyId} />
          ) : (
            <CopyOutlined onClick={handleCopyId} />
          )}
        </code>
        <div className={styles['actions']}>
          {isVideo ? (
            <VideoPlayer.Bar />
          ) : (
            <SongPlayer data={data} onPlayingChange={setIsPlaying} />
          )}
        </div>
      </div>
    </article>
  );

  if (isVideo) {
    return (
      <VideoPlayer data={data} onPlayingChange={setIsPlaying}>
        {card}
      </VideoPlayer>
    );
  }

  return card;
};

/** 歌曲信息摘要 */
export const SongInfoGrid: React.FC<SongCardProps> = ({ data }) => {
  return (
    <div className={styles['infoGrid']}>
      {[
        ['艺人', data.artist || '—'],
        ['专辑', data.album || '—'],
        ['音质数', `${data.urls?.length || 0} 档`],
      ].map(([label, value]) => (
        <div key={label} className={styles['infoChip']}>
          <span className={styles['infoLabel']}>{label}</span>
          <span className={styles['infoValue']}>{value}</span>
        </div>
      ))}
    </div>
  );
};

type QualityDownloadStatus = 'idle' | 'downloading' | 'decrypting' | 'embedding' | 'done' | 'error';

/**
 * 是否处于下载 / 解密 / 写入过程中
 * @example
 * isDownloadBusy('embedding') // true
 */
const isDownloadBusy = (status: QualityDownloadStatus) =>
  status === 'downloading' || status === 'decrypting' || status === 'embedding';

/** 音质列表 */
export const SongQualityList: React.FC<SongCardProps> = ({ data }) => {
  const [downloadStates, setDownloadStates] = useState<
    Record<number, { progress: number; status: QualityDownloadStatus }>
  >({});

  const patchDownloadState = (
    index: number,
    patch: Partial<{ progress: number; status: QualityDownloadStatus }>,
  ) => {
    setDownloadStates((prev) => ({
      ...prev,
      [index]: {
        progress: prev[index]?.progress ?? 0,
        status: prev[index]?.status ?? 'idle',
        ...patch,
      },
    }));
  };

  const { embedMetadata } = useEmbedAudioMetadata({
    onLog: (message, type) => {
      console.log('message', message);
      console.log('type', type);
    },
  });
  const handleDownload = async (item: QishuiUrl, index: number) => {
    if (!item.url) {
      msgError('缺少播放地址');
      return;
    }
    if (isDownloadBusy(downloadStates[index]?.status ?? 'idle')) {
      return;
    }

    patchDownloadState(index, { progress: 0, status: 'downloading' });

    try {
      await downloadSongAudio({
        data,
        item,
        embedMetadata,
        onProgress: (phase, ratio) => {
          const progress = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
          if (phase === 'downloading') {
            patchDownloadState(index, { progress, status: 'downloading' });
            return;
          }
          if (phase === 'decrypting') {
            patchDownloadState(index, { progress: 100, status: 'decrypting' });
            return;
          }
          if (phase === 'embedding') {
            patchDownloadState(index, { progress, status: 'embedding' });
            console.log('progress',progress)
          }
        },
      });
      patchDownloadState(index, { progress: 100, status: 'done' });
      msgSuccess(item.playAuth ? '解密下载成功' : '下载成功');
    } catch (error) {
      console.error(error);
      patchDownloadState(index, { status: 'error', progress: 0 });
      msgError(error instanceof Error ? error.message : '下载失败（可能是 CORS）');
    }
  };

  return (
    <div className={styles['qualityList']}>
      {(data.urls || []).map((item: QishuiUrl, index: number) => {
        const state = downloadStates[index];
        const progress = state?.progress ?? 0;
        const status = state?.status ?? 'idle';
        const busy = isDownloadBusy(status);
        const progressText = (() => {
          if (status === 'downloading') {
            return `下载中 ${progress}%`;
          }
          if (status === 'decrypting') {
            return '解密中';
          }
          if (status === 'embedding') {
            return `写入元数据中 ${progress}%`;
          }
          return null;
        })();

        return (
          <div
            key={`${item.quality}-${index}`}
            className={classNames(styles['qualityItem'], {
              [styles['qualityItemProgress']]: busy,
              [styles['qualityItemDone']]: status === 'done',
              [styles['qualityItemError']]: status === 'error',
            })}
            style={busy ? ({ '--progress': `${progress}%` } as Record<string, string>) : undefined}>
            <span className={styles['qualityBadge']}>{qualityLabel(item.quality)}</span>
            <span className={styles['qualityMeta']}>
              {(item.format || '').toUpperCase()} · {formatSize(item.size)}
              {busy
                ? `  ${progressText ? ` · ${progressText}` : ''}`
                : status === 'done'
                  ? ' · 已完成'
                  : null}
            </span>
            <div className={styles['qualityActions']}>
              <button
                className={classNames(styles['btn'], styles['btnPrimary'], styles['btnSm'])}
                type='button'
                aria-label='解密下载'
                disabled={busy}
                onClick={() => handleDownload(item, index)}>
                {busy ? (
                  <LoadingOutlined />
                ) : status === 'done' ? (
                  <CheckOutlined />
                ) : (
                  <DownloadOutlined />
                )}
                {busy
                  ? status === 'decrypting'
                    ? '解密中'
                    : status === 'embedding'
                      ? '写入中'
                      : '下载中'
                  : status === 'done'
                    ? '已完成'
                    : '下载'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 歌词展示 */
export const SongLyricBox: React.FC<SongCardProps> = ({ data }) => {
  const [lyricMode, setLyricMode] = useState<'lrc' | 'txt'>('lrc');
  const { lrc, lrcText } = data;
  const lyricText = lyricMode === 'lrc' ? lrc || '暂无歌词' : lrcText || '暂无歌词';

  /** 保存歌词 */
  const handleSaveLyric = () => {
    try {
      downloadSongLyric(data, lyricMode);
      msgSuccess('歌词已保存');
    } catch (error) {
      msgError(error instanceof Error ? error.message : '暂无歌词可保存');
    }
  };

  return (
    <div className={styles['lyricWrap']}>
      <div className={styles['lyricToolbar']}>
        <div className={styles['lyricSegment']} role='tablist' aria-label='歌词格式'>
          <button
            className={classNames(styles['lyricSegmentItem'], {
              [styles['lyricSegmentItemActive']]: lyricMode === 'lrc',
            })}
            type='button'
            role='tab'
            aria-selected={lyricMode === 'lrc'}
            onClick={() => setLyricMode('lrc')}>
            LRC
          </button>
          <button
            className={classNames(styles['lyricSegmentItem'], {
              [styles['lyricSegmentItemActive']]: lyricMode === 'txt',
            })}
            type='button'
            role='tab'
            aria-selected={lyricMode === 'txt'}
            onClick={() => setLyricMode('txt')}>
            TXT
          </button>
        </div>
        <button
          className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
          type='button'
          aria-label='保存歌词'
          disabled={!lyricText}
          onClick={handleSaveLyric}>
          <SaveOutlined />
          保存
        </button>
      </div>
      <pre className={styles['lyricBox']}>{lyricText}</pre>
    </div>
  );
};

interface SongResultProps {
  data: MusicInfo;
}

/**
 * 歌曲解析结果
 */
const SongResult: React.FC<SongResultProps> = ({ data }) => {
  return (
    <div className={styles['result']} aria-live='polite'>
      <EngineStatus />
      <SongCard data={data} />
      <SongInfoGrid data={data} />
    </div>
  );
};

export default SongResult;
