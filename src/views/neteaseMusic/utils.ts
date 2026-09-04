import type {
  NeteaseApiPrivilege,
  NeteaseApiSong,
  NeteaseSongQualityData,
  NeteaseSongQualityItem,
  NeteaseSoundQualityLevel,
} from '@/types/netease';
import { QUALITY_LABEL_MAP, QUALITY_SLOT_ORDER } from './constants/index';

/** 音质列表行（保留接口原始档位字段） */
export interface NeteaseQualitySlotRow {
  key: string;
  level: NeteaseSoundQualityLevel;
  item: NeteaseSongQualityItem;
}

/**
 * 格式化文件大小
 * @example
 * formatSize(4128768) // => '3.9 MB'
 */
export const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * 格式化时长（秒 → m:ss）
 * @example
 * formatDuration(326) // => '5:26'
 */
export const formatDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * 音质标签文案
 * @example
 * qualityLabel('lossless') // => '无损'
 */
export const qualityLabel = (quality: string) => QUALITY_LABEL_MAP[quality]?.label || quality;

/**
 * 格式化码率
 * @example
 * formatBitrate(320000) // => '320 kbps'
 */
export const formatBitrate = (br = 0) => {
  if (!br) return '';
  if (br < 1000) return `${br} kbps`;
  return `${Math.round(br / 1000)} kbps`;
};

/**
 * 格式化采样率
 * @example
 * formatSampleRate(44100) // => '44.1 kHz'
 */
export const formatSampleRate = (sr = 0) => {
  if (!sr) return '';
  if (sr < 1000) return `${sr} Hz`;
  const khz = sr / 1000;
  const digits = Number.isInteger(khz) ? 0 : 1;
  return `${khz.toFixed(digits)} kHz`;
};

/**
 * 拼接艺人名称
 * @example
 * formatNeteaseArtistNames([{ id: 1, name: 'Beyond' }]) // => 'Beyond'
 */
export const formatNeteaseArtistNames = (artists?: { name?: string }[] | null) =>
  artists
    ?.map((item) => item.name)
    .filter(Boolean)
    .join(' / ') || '';

/**
 * 按接口音质字段列出可展示档位，item 保持后端原始结构
 * @example
 * listNeteaseQualitySlots(data.quality)
 */
export const listNeteaseQualitySlots = (
  quality?: NeteaseSongQualityData | null,
): NeteaseQualitySlotRow[] => {
  if (!quality) return [];
  const rows: NeteaseQualitySlotRow[] = [];
  for (const { slot, level } of QUALITY_SLOT_ORDER) {
    if (slot === 'sk' && quality.sks?.length) {
      quality.sks.forEach((item, index) => {
        rows.push({
          key: `${level}-${item.it || index}`,
          level: level as NeteaseSoundQualityLevel,
          item,
        });
      });
      continue;
    }
    const item = quality[slot as keyof NeteaseSongQualityData];
    if (!item || typeof item === 'number' || Array.isArray(item)) continue;
    rows.push({
      key: `${level}-${item.it || ''}`,
      level: level as NeteaseSoundQualityLevel,
      item,
    });
  }
  return rows;
};

/**
 * 延迟
 * @example
 * await sleep(700)
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 将 http 封面升级为 https，避免混合内容
 * @example
 * toHttpsUrl('http://p1.music.126.net/a.jpg')
 */
export const toHttpsUrl = (url?: string) => {
  if (!url) return '';
  return url.replace(/^http:\/\//, 'https://');
};

/**
 * 格式化播放量
 * @example
 * formatPlayCount(12345) // => '1.2万'
 */
export const formatPlayCount = (count = 0) => {
  if (count < 10000) return String(count);
  if (count < 100000000) {
    const value = count / 10000;
    const digits = value >= 100 ? 0 : 1;
    return `${value.toFixed(digits).replace(/\.0$/, '')}万`;
  }
  return `${(count / 100000000).toFixed(1).replace(/\.0$/, '')}亿`;
};

/**
 * 判断曲目是否仅可试听 / 无版权
 * @example
 * isNeteasePreviewOnly(song, privilege)
 */
export const isNeteasePreviewOnly = (song: NeteaseApiSong, privilege?: NeteaseApiPrivilege) => {
  if (song.noCopyrightRcmd) return true;
  if (!privilege) return false;
  if ((privilege.st ?? 0) < 0) return true;
  if (privilege.pl === 0) return true;
  return false;
};

