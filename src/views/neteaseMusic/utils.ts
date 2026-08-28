import type {
  NeteaseApiPrivilege,
  NeteaseApiSong,
  ParseNeteasePlaylistResponseData,
  ParseNeteaseSongResponseData,
} from '@/types/netease';
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

const QUALITY_LABEL_MAP: Record<string, string> = {
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
 * 音质标签文案
 * @example
 * qualityLabel('lossless') // => '无损'
 */
export const qualityLabel = (quality: string) => QUALITY_LABEL_MAP[quality] || quality;

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
      artist: song.ar?.map((item) => item.name).filter(Boolean).join(' / ') || '未知艺人',
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

  const download = data?.download;
  const artists = (song.ar || []).map((item) => ({
    id: String(item.id),
    name: item.name,
    avatar: '',
  }));
  const urls: NeteaseUrl[] = download
    ? [
        {
          quality: download.level || '',
          format: download.encodeType || download.type || '',
          size: download.size || 0,
          url: toHttpsUrl(download.url || '') || download.url || '',
          encryptionMethod: 'none',
        },
      ]
    : [];

  return {
    trackId: String(song.id),
    title: song.name || '未知歌曲',
    artist: artists.map((item) => item.name).filter(Boolean).join(' / ') || '未知歌手',
    artists,
    album: song.al?.name || '未知专辑',
    cover: toHttpsUrl(song.al?.picUrl) || PLACEHOLDER_COVER,
    urls,
    lrc: data?.lyric?.lrc || '',
    lrcText: data?.lyric?.lrcText || '',
  };
};
