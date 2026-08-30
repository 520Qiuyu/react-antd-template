import type {
  NeteaseApiPrivilege,
  NeteaseApiSong,
  NeteaseSongDownloadData,
  NeteaseSongQualityData,
  NeteaseSongQualityItem,
  ParseNeteasePlaylistResponseData,
  ParseNeteaseSongResponseData,
  ParseNeteaseSongUrl,
} from '@/types/netease';
import { QUALITY_LABEL_MAP, QUALITY_SLOT_ORDER } from './constants/index';
import { PLACEHOLDER_COVER } from './mock';
import type { NeteasePlaylistInfo, NeteaseSongInfo, NeteaseTrack, NeteaseUrl } from './types';

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
 * 将接口 quality 摊平为页面音质列表；download.level 对应档位会挂上可播地址
 * @example
 * flattenNeteaseQuality(data.quality, data.download)
 */
export const flattenNeteaseQuality = (
  quality: NeteaseSongQualityData | null | undefined,
  download?: ParseNeteaseSongUrl | null,
): NeteaseUrl[] => {
  const downloadLevel = download?.level || '';
  const downloadUrl = toHttpsUrl(download?.url || '') || download?.url || '';
  const downloadFormat = download?.encodeType || download?.type || '';

  const toRow = (level: string, item: NeteaseSongQualityItem, attachUrl: boolean): NeteaseUrl => ({
    quality: level,
    format: item.it || (attachUrl ? downloadFormat : '') || '',
    size: item.size || 0,
    url: attachUrl ? downloadUrl : '',
    encryptionMethod: 'none',
    br: item.br,
    sr: item.sr,
    playable: attachUrl && Boolean(downloadUrl),
  });

  const rows: NeteaseUrl[] = [];

  if (quality) {
    for (const { slot, level } of QUALITY_SLOT_ORDER) {
      if (slot === 'sk' && quality.sks?.length) {
        const formatLower = downloadFormat.toLowerCase();
        const matchIndex = quality.sks.findIndex(
          (item) => item.it && formatLower && item.it.toLowerCase() === formatLower,
        );
        quality.sks.forEach((item, index) => {
          const attach =
            downloadLevel === 'sky' && (matchIndex >= 0 ? index === matchIndex : index === 0);
          rows.push(toRow(level, item, attach));
        });
        continue;
      }

      const item = quality[slot];
      if (!item) continue;
      rows.push(toRow(level, item, downloadLevel === level));
    }
  }

  if (rows.length) return rows;
  if (!download) return [];

  return [
    {
      quality: download.level || '',
      format: downloadFormat,
      size: download.size || 0,
      url: downloadUrl,
      encryptionMethod: 'none',
      playable: Boolean(downloadUrl),
    },
  ];
};

/**
 * 将下载接口结果写回音质行
 * @example
 * applyNeteaseDownloadToUrl(row, res.data)
 */
export const applyNeteaseDownloadToUrl = (
  row: NeteaseUrl,
  data: NeteaseSongDownloadData,
): NeteaseUrl => {
  const url = toHttpsUrl(data.url || '') || data.url || '';
  return {
    ...row,
    url,
    size: data.size || row.size,
    format: data.type || row.format,
    br: data.br || row.br,
    sr: data.sr || row.sr,
    quality: data.level || row.quality,
    playable: Boolean(url),
  };
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
const isNeteasePreviewOnly = (song: NeteaseApiSong, privilege?: NeteaseApiPrivilege) => {
  if (song.noCopyrightRcmd) return true;
  if (!privilege) return false;
  if ((privilege.st ?? 0) < 0) return true;
  if (privilege.pl === 0) return true;
  return false;
};

/**
 * 将网易云歌单解析接口数据映射为页面结构
 * @example
 * const playlist = mapNeteasePlaylistParseResult(res.data);
 */
export const mapNeteasePlaylistParseResult = (
  data: ParseNeteasePlaylistResponseData | null | undefined,
): NeteasePlaylistInfo | null => {
  const playlist = data?.detail?.playlist;
  if (!playlist?.id) return null;

  const songs = data?.all?.songs?.length ? data.all.songs : playlist.tracks || [];
  const privileges = data?.all?.privileges || data?.detail?.privileges || [];
  const privilegeMap = new Map(privileges.map((item) => [item.id, item]));
  const cover = toHttpsUrl(playlist.coverImgUrl) || PLACEHOLDER_COVER;

  const tracks: NeteaseTrack[] = songs.map((song) => {
    const privilege = privilegeMap.get(song.id);
    const previewOnly = isNeteasePreviewOnly(song, privilege);
    return {
      id: String(song.id),
      title: song.name || '未知歌曲',
      artist:
        song.ar
          ?.map((item) => item.name)
          .filter(Boolean)
          .join(' / ') || '未知艺人',
      album: song.al?.name || '未知专辑',
      cover: toHttpsUrl(song.al?.picUrl) || cover,
      duration: Math.round((song.dt || 0) / 1000),
      isPreviewOnly: previewOnly,
      previewDuration: previewOnly ? 30 : undefined,
    };
  });

  return {
    id: String(playlist.id),
    title: playlist.name || '未命名歌单',
    cover,
    owner: playlist.creator?.nickname || '未知',
    ownerAvatar: toHttpsUrl(playlist.creator?.avatarUrl),
    countTracks: playlist.trackCount ?? tracks.length,
    playCount: playlist.playCount,
    subscribedCount: playlist.subscribedCount,
    description: playlist.description,
    tags: playlist.tags || [],
    createTime: playlist.createTime,
    tracks,
  };
};

/**
 * 将网易云单曲解析接口数据映射为页面结构
 * @example
 * const song = mapNeteaseSongParseResult(res.data);
 */
export const mapNeteaseSongParseResult = (
  data: ParseNeteaseSongResponseData | null | undefined,
): NeteaseSongInfo | null => {
  const song = data?.song;
  if (!song?.id) return null;

  const artists = (song.ar || []).map((item) => ({
    id: String(item.id),
    name: item.name,
    avatar: '',
  }));
  const urls = flattenNeteaseQuality(data?.quality, data?.download);

  return {
    trackId: String(song.id),
    title: song.name || '未知歌曲',
    artist:
      artists
        .map((item) => item.name)
        .filter(Boolean)
        .join(' / ') || '未知歌手',
    artists,
    album: song.al?.name || '未知专辑',
    cover: toHttpsUrl(song.al?.picUrl) || PLACEHOLDER_COVER,
    urls,
    lrc: data?.lyric?.lrc || '',
    lrcText: data?.lyric?.lrcText || '',
  };
};
