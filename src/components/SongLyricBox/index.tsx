import { downloadBlob } from '@/utils/download';
import { msgError, msgSuccess } from '@/utils/modal';
import { SaveOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import styles from './index.module.less';

export type SongLyricMode = 'lrc' | 'txt';
export type SongLyricTheme = 'qishui' | 'netease';

interface SongLyricBoxProps {
  /** 带时间轴的 LRC */
  lrc?: string;
  /** 纯文本歌词 */
  lrcText?: string;
  /** 配色主题：汽水绿 / 网易红 */
  theme?: SongLyricTheme;
  /** 保存文件名（不含扩展名） */
  filename?: string;
  /** 自定义保存；不传则下载为文件 */
  onSave?: (mode: SongLyricMode, text: string) => void;
}

/**
 * 通用歌词预览（LRC / TXT 切换）
 * @example
 * ```tsx
 * <SongLyricBox theme='netease' lrc={data.lrc} lrcText={data.lrcText} filename={data.title} />
 * ```
 */
const SongLyricBox: React.FC<SongLyricBoxProps> = ({
  lrc,
  lrcText,
  theme = 'qishui',
  filename,
  onSave,
}) => {
  const [lyricMode, setLyricMode] = useState<SongLyricMode>('lrc');
  const currentLyric = lyricMode === 'lrc' ? lrc : lrcText;
  const hasLyric = Boolean(currentLyric?.trim());
  const displayText = hasLyric ? currentLyric! : '暂无歌词';

  const handleModeChange = (mode: SongLyricMode) => {
    setLyricMode(mode);
  };

  const handleSaveLyric = () => {
    if (!hasLyric) return;
    try {
      if (onSave) {
        onSave(lyricMode, currentLyric!);
      } else {
        const basename = (filename || '歌词').replace(/[\\/:*?"<>|]/g, '_').trim() || '歌词';
        downloadBlob(
          new Blob([currentLyric!], { type: 'text/plain;charset=utf-8' }),
          `${basename}.${lyricMode}`,
        );
      }
      msgSuccess('歌词已保存');
    } catch (error) {
      msgError(error instanceof Error ? error.message : '暂无歌词可保存');
    }
  };

  return (
    <div className={styles['lyricWrap']} data-theme={theme}>
      <div className={styles['lyricToolbar']}>
        <div className={styles['lyricSegment']} role='tablist' aria-label='歌词格式'>
          <button
            className={classNames(styles['lyricSegmentItem'], {
              [styles['lyricSegmentItemActive']]: lyricMode === 'lrc',
            })}
            type='button'
            role='tab'
            aria-selected={lyricMode === 'lrc'}
            onClick={() => handleModeChange('lrc')}>
            LRC
          </button>
          <button
            className={classNames(styles['lyricSegmentItem'], {
              [styles['lyricSegmentItemActive']]: lyricMode === 'txt',
            })}
            type='button'
            role='tab'
            aria-selected={lyricMode === 'txt'}
            onClick={() => handleModeChange('txt')}>
            TXT
          </button>
        </div>
        <button
          className={styles['saveBtn']}
          type='button'
          aria-label='保存歌词'
          disabled={!hasLyric}
          onClick={handleSaveLyric}>
          <SaveOutlined />
          保存
        </button>
      </div>
      <pre className={styles['lyricBox']}>{displayText}</pre>
    </div>
  );
};

export default SongLyricBox;
