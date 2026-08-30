/**
 * 音质列表映射
 */
export const QUALITY_LABEL_MAP: Record<string, string> = {
  standard: '标准',
  higher: '较高',
  // cspell:ignore exhigh hires jyeffect jymaster
  exhigh: '极高',
  lossless: '无损',
  hires: 'Hi-Res',
  jyeffect: '高清臻音',
  jymaster: '超清母带',
  sky: '沉浸环绕声',
  vivid: '臻音全景声',
  dolby: '杜比全景声',
  hq: 'HQ',
};

/**
 * 接口音质字段 → 网易云 level（高档位在前）
 */
export const QUALITY_SLOT_ORDER = [
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
