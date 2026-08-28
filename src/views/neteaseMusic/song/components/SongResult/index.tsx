import copy from '@/utils/copy';
import { msgError, msgSuccess } from '@/utils/modal';
import {
  CheckOutlined,
  CopyOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import shared from '../../../components/shared.module.less';
import type { NeteaseSongInfo, NeteaseUrl } from '../../../types';
import { formatSize, qualityLabel } from '../../../utils';
import styles from './index.module.less';

interface SongResultProps {
  data: NeteaseSongInfo;
}

/**
 * 单曲解析结果卡片
 * @example
 * ```tsx
 * <SongResult data={MOCK_SONG} />
 * ```
 */
const SongResult: React.FC<SongResultProps> = ({ data }) => {
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
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  const handleCopyLrc = async () => {
    const text = data.lrc || data.lrcText || '';
    if (!text) return;
    try {
      await copy(text);
      setCopyLrcDone(true);
      msgSuccess('已复制歌词');
      setTimeout(() => setCopyLrcDone(false), 1400);
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  return (
    <>
      <article className={styles['songCard']}>
        <div className={styles['coverWrap']}>
          <div className={styles['coverGlow']} aria-hidden='true' />
          <img className={styles['cover']} src={data.cover} alt='专辑封面' />
        </div>
        <div className={styles['meta']}>
          <span className={styles['album']}>{data.album || '未知专辑'}</span>
          <h3 className={styles['title']} title={data.title || '未知歌曲'}>
            {data.title || '未知歌曲'}
          </h3>
          <div className={styles['artist']}>
            {avatar ? <img className={styles['avatar']} src={avatar} alt='' /> : null}
            <span>{data.artist || '未知歌手'}</span>
          </div>
          <code className={styles['trackId']}>{data.trackId || '—'}</code>
          <div className={styles['actions']}>
            <button
              className={classNames(shared['btn'], shared['btnPrimary'], shared['btnSm'])}
              type='button'
              aria-label='复制歌曲 ID'
              onClick={handleCopyId}>
              {copyIdDone ? <CheckOutlined /> : <CopyOutlined />}
              {copyIdDone ? '已复制' : '复制 ID'}
            </button>
            <button
              className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
              type='button'
              aria-label='复制歌词'
              onClick={handleCopyLrc}>
              {copyLrcDone ? <CheckOutlined /> : <FileTextOutlined />}
              {copyLrcDone ? '已复制' : '复制歌词'}
            </button>
          </div>
        </div>
      </article>

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
    </>
  );
};

interface SongQualityListProps {
  urls: NeteaseUrl[];
}

/**
 * 音质列表
 * @example
 * ```tsx
 * <SongQualityList urls={data.urls} />
 * ```
 */
export const SongQualityList: React.FC<SongQualityListProps> = ({ urls }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyUrl = async (item: NeteaseUrl, index: number) => {
    if (!item.url) return;
    try {
      await copy(item.url);
      setCopiedIndex(index);
      msgSuccess('已复制播放地址');
      setTimeout(() => setCopiedIndex(null), 1400);
    } catch (error) {
      console.log('error', error);
      msgError('复制失败');
    }
  };

  return (
    <div className={styles['qualityList']}>
      {urls.map((item, index) => (
        <div key={`${item.quality}-${index}`} className={styles['qualityItem']}>
          <span className={styles['qualityBadge']}>{qualityLabel(item.quality)}</span>
          <span className={styles['qualityMeta']}>
            {(item.format || '').toUpperCase()} · {formatSize(item.size)}
          </span>
          <span className={styles['qualityMeta']}>{item.encryptionMethod || 'none'}</span>
          <button
            className={classNames(shared['btn'], shared['btnGhost'], shared['btnSm'])}
            type='button'
            aria-label='复制播放地址'
            onClick={() => handleCopyUrl(item, index)}>
            {copiedIndex === index ? <CheckOutlined /> : <LinkOutlined />}
            {copiedIndex === index ? '已复制' : '复制链接'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default SongResult;
