import { DEFAULT_CONFIG, resolveDownloadBasename, useConfig } from '@/hooks/useConfig';
import type { InputRef } from 'antd';
import { Input } from 'antd';
import { useMemo, useRef } from 'react';
import styles from './index.module.less';

export type DownloadNameFormatTheme = 'qishui' | 'netease';

interface DownloadNameFormatFieldProps {
  /** 配色主题：汽水绿 / 网易红 */
  theme?: DownloadNameFormatTheme;
  /** 预览文件扩展名，不含点 */
  ext?: string;
}

const NAME_FORMAT_TOKENS = ['【序号】', '【歌名】', '【专辑名】', '【歌手】'] as const;

/** 名称格式预览用的样例曲目 */
const SAMPLE_DOWNLOAD_PARTS = {
  index: 1,
  title: '晴天',
  album: '叶惠美',
  artist: '周杰伦',
};

const SAMPLE_TOKEN_TEXT: Record<(typeof NAME_FORMAT_TOKENS)[number], string> = {
  '【序号】': '1',
  '【歌名】': '晴天',
  '【专辑名】': '叶惠美',
  '【歌手】': '周杰伦',
};

const NAME_FORMAT_SPLIT_RE = /(【(?:序号|歌名|专辑名|歌手)】)/g;

/**
 * 将下载名称格式拆成可高亮的示例片段
 * @example
 * getNameFormatPreviewSegments('【歌名】-【歌手】')
 */
const getNameFormatPreviewSegments = (format?: string) => {
  const template = format?.trim() || DEFAULT_CONFIG.downloadNameFormat;
  return template
    .split(NAME_FORMAT_SPLIT_RE)
    .filter(Boolean)
    .map((part) => {
      const sample = SAMPLE_TOKEN_TEXT[part as keyof typeof SAMPLE_TOKEN_TEXT];
      return {
        text: sample ?? part,
        isToken: Boolean(sample),
      };
    });
};

/**
 * 下载名称格式设置
 * @example
 * ```tsx
 * <DownloadNameFormatField theme='netease' ext='mp3' />
 * ```
 */
const DownloadNameFormatField: React.FC<DownloadNameFormatFieldProps> = ({
  theme = 'qishui',
  ext = 'mp3',
}) => {
  const { config, setConfig } = useConfig();
  const downloadNameFormat = config?.downloadNameFormat ?? DEFAULT_CONFIG.downloadNameFormat;
  const inputRef = useRef<InputRef>(null);
  const previewExt = ext.replace(/^\./, '') || 'mp3';

  const handleChange = (value: string) => {
    setConfig({ ...config!, downloadNameFormat: value });
  };

  /**
   * 在输入框光标处插入占位符；无输入元素时追加到末尾
   * @example
   * handleInsertToken('【专辑名】')
   */
  const handleInsertToken = (token: string) => {
    const current = downloadNameFormat ?? DEFAULT_CONFIG.downloadNameFormat;
    const el = inputRef.current?.input;
    if (!el) {
      handleChange(`${current}${token}`);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
    handleChange(next);
    requestAnimationFrame(() => {
      const pos = start + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const previewSegments = useMemo(
    () => getNameFormatPreviewSegments(downloadNameFormat),
    [downloadNameFormat],
  );
  const previewText = useMemo(
    () => `${resolveDownloadBasename(SAMPLE_DOWNLOAD_PARTS, downloadNameFormat)}.${previewExt}`,
    [downloadNameFormat, previewExt],
  );

  return (
    <label className={styles['field']} data-theme={theme} htmlFor='download-name-format'>
      <span className={styles['fieldLabel']}>下载名称格式</span>
      <Input
        id='download-name-format'
        ref={inputRef}
        className={styles['fieldInput']}
        value={downloadNameFormat}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={DEFAULT_CONFIG.downloadNameFormat}
        aria-label='下载名称格式'
      />
      <div className={styles['tokenRow']} role='group' aria-label='插入占位符'>
        {NAME_FORMAT_TOKENS.map((token) => (
          <button
            key={token}
            type='button'
            className={styles['token']}
            onClick={() => handleInsertToken(token)}>
            {token}
          </button>
        ))}
      </div>
      <output className={styles['preview']} htmlFor='download-name-format' aria-live='polite'>
        <span className={styles['previewLabel']}>示例 · 晴天 / 周杰伦</span>
        <span key={previewText} className={styles['previewName']} title={previewText}>
          {previewSegments.map((segment, index) =>
            segment.isToken ? (
              <em key={`${segment.text}-${index}`} className={styles['previewToken']}>
                {segment.text}
              </em>
            ) : (
              <span key={`${segment.text}-${index}`} className={styles['previewSep']}>
                {segment.text}
              </span>
            ),
          )}
          <span className={styles['previewExt']}>.{previewExt}</span>
        </span>
      </output>
    </label>
  );
};

export default DownloadNameFormatField;
