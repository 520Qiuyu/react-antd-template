import type { NeteasePlaylistDetailData, NeteasePlaylistTrackAllData } from './playlist';
import type { NeteaseApiSong, NeteaseSongLyric, NeteaseSongQualityData } from './song';

/** 网易云解析查询参数 */
export interface ParseNeteaseShareLinkParams {
  shareLink: string;
  cardSecret: string;
}

/** 网易云单曲解析下载信息 */
export interface ParseNeteaseSongUrl {
  url: string | null;
  size?: number;
  type?: string | null;
  encodeType?: string | null;
  level?: string | null;
}

/** 网易云单曲解析响应 */
export interface ParseNeteaseSongResponseData {
  song: NeteaseApiSong | null;
  download: ParseNeteaseSongUrl | null;
  lyric: NeteaseSongLyric;
  quality?: NeteaseSongQualityData | null;
}

/** 网易云歌单解析响应 */
export interface ParseNeteasePlaylistResponseData {
  detail: NeteasePlaylistDetailData | null;
  all: NeteasePlaylistTrackAllData | null;
}
