import {
  CheckOutlined,
  CopyOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import type { MusicInfo, QishuiUrl } from '@/types/qishui';
import copy from '@/utils/copy';
import { msgSuccess } from '@/utils/modal';
import { formatSize, qualityLabel } from '../../utils';
import styles from './index.module.less';

interface SongCardProps {
  data: MusicInfo;
}

/** 歌曲信息卡片 */
export const SongCard: React.FC<SongCardProps> = ({ data }) => {
  const [copyIdDone, setCopyIdDone] = useState(false);
  const [copyLrcDone, setCopyLrcDone] = useState(false);
  const avatar = data.artists?.[0]?.avatar;

  const handleCopyId = async () => {
    if (!data.trackId) return;
    try {
      await copy(data.trackId);
      setCopyIdDone(true);
      msgSuccess('已复制歌曲 ID');
      setTimeout(() => setCopyIdDone(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const handleCopyLrc = async () => {
    try {
      await copy(data.lrc || data.lrcText || '');
      setCopyLrcDone(true);
      msgSuccess('已复制歌词');
      setTimeout(() => setCopyLrcDone(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <article className={styles['songCard']}>
      <div className={styles['coverWrap']}>
        <div className={styles['coverGlow']} aria-hidden='true' />
        <img className={styles['cover']} src={data.cover} alt='专辑封面' />
      </div>
      <div className={styles['meta']}>
        <span className={styles['album']}>{data.album || '未知专辑'}</span>
        <h3 className={styles['title']}>{data.title || '未知歌曲'}</h3>
        <div className={styles['artist']}>
          {avatar ? <img className={styles['avatar']} src={avatar} alt='' /> : null}
          <span>{data.artist || '未知歌手'}</span>
        </div>
        <code className={styles['trackId']}>{data.trackId || '—'}</code>
        <div className={styles['actions']}>
          <button
            className={classNames(styles['btn'], styles['btnPrimary'], styles['btnSm'])}
            type='button'
            aria-label='复制歌曲 ID'
            onClick={handleCopyId}>
            {copyIdDone ? <CheckOutlined /> : <CopyOutlined />}
            {copyIdDone ? '已复制' : '复制 ID'}
          </button>
          <button
            className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
            type='button'
            aria-label='复制歌词'
            onClick={handleCopyLrc}>
            {copyLrcDone ? <CheckOutlined /> : <FileTextOutlined />}
            {copyLrcDone ? '已复制' : '复制歌词'}
          </button>
        </div>
      </div>
    </article>
  );
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

/** 音质列表 */
export const SongQualityList: React.FC<SongCardProps> = ({ data }) => {
  const [copiedUrlIndex, setCopiedUrlIndex] = useState<number | null>(null);

  const handleCopyUrl = async (url: string, index: number) => {
    try {
      await copy(url);
      setCopiedUrlIndex(index);
      msgSuccess('已复制播放地址');
      setTimeout(() => setCopiedUrlIndex(null), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles['qualityList']}>
      {(data.urls || []).map((item: QishuiUrl, index: number) => (
        <div key={`${item.quality}-${index}`} className={styles['qualityItem']}>
          <span className={styles['qualityBadge']}>{qualityLabel(item.quality)}</span>
          <span className={styles['qualityMeta']}>
            {(item.format || '').toUpperCase()} · {formatSize(item.size)}
          </span>
          <span className={styles['qualityMeta']}>{item.encryptionMethod || 'none'}</span>
          <button
            className={classNames(styles['btn'], styles['btnGhost'], styles['btnSm'])}
            type='button'
            aria-label='复制播放地址'
            onClick={() => handleCopyUrl(item.url, index)}>
            {copiedUrlIndex === index ? <CheckOutlined /> : <LinkOutlined />}
            {copiedUrlIndex === index ? '已复制' : '复制链接'}
          </button>
        </div>
      ))}
    </div>
  );
};

/** 歌词展示 */
export const SongLyricBox: React.FC<SongCardProps> = ({ data }) => {
  const lyricText = data.lrcText || data.lrc || '暂无歌词';
  return <pre className={styles['lyricBox']}>{lyricText}</pre>;
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
      <SongCard data={data} />
      <SongInfoGrid data={data} />
    </div>
  );
};

export default SongResult;
