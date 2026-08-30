/**
 * 音质列表映射
 */
export const QUALITY_LABEL_MAP: Record<string, { label: string; format: string }> = {
  standard: { label: '标准', format: 'mp3' },
  higher: { label: '较高', format: 'mp3' },
  exhigh: { label: '极高', format: 'mp3' },
  lossless: { label: '无损', format: 'flac' },
  hires: { label: 'Hi-Res', format: 'flac' },
  jyeffect: { label: '高清臻音', format: 'flac' },
  jymaster: { label: '超清母带', format: 'flac' },
  sky: { label: '沉浸环绕声', format: 'flac' },
  vivid: { label: '臻音全景声', format: 'flac' },
  dolby: { label: '杜比全景声', format: 'flac' },
  hq: { label: 'HQ', format: 'flac' },
};

/**
 * 接口音质字段 → 网易云 level（高档位在前）
 */
export const QUALITY_SLOT_ORDER: { slot: string; level: keyof typeof QUALITY_LABEL_MAP }[] = [
  { slot: 'jm', level: 'jymaster' },
  { slot: 'je', level: 'jyeffect' },
  { slot: 'vi', level: 'vivid' },
  { slot: 'db', level: 'dolby' },
  { slot: 'sk', level: 'sky' },
  { slot: 'hr', level: 'hires' },
  { slot: 'sq', level: 'lossless' },
  { slot: 'h', level: 'exhigh' },
  { slot: 'm', level: 'higher' },
  { slot: 'l', level: 'standard' },
] as const;

/**
 * 音质下拉选项
 */
export const QUALITY_OPTIONS = Object.entries(QUALITY_LABEL_MAP).map(([value, label]) => ({
  label,
  value,
}));

/**
 * 网易云下载首选音质选项（高档位在前）
 */
export const NETEASE_DOWNLOAD_QUALITY_OPTIONS = QUALITY_SLOT_ORDER.map(({ level }) => ({
  value: level,
  label: `${QUALITY_LABEL_MAP[level].label}( ${QUALITY_LABEL_MAP[level].format})`,
}));
