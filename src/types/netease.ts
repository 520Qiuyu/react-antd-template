/** 网易云解析查询参数 */
export interface ParseNeteaseShareLinkParams {
  shareLink: string;
  cardSecret?: string;
}

/** 网易云歌曲艺人 */
export interface NeteaseApiArtist {
  id: number;
  name: string;
}

/** 网易云歌曲专辑 */
export interface NeteaseApiAlbum {
  id: number;
  name: string;
  picUrl: string;
}

/** 网易云歌曲 */
export interface NeteaseApiSong {
  id: number;
  name: string;
  ar?: NeteaseApiArtist[];
  al?: NeteaseApiAlbum;
  dt?: number;
  fee?: number;
  noCopyrightRcmd?: unknown;
}

/** 网易云歌曲权限 */
export interface NeteaseApiPrivilege {
  id: number;
  fee?: number;
  st?: number;
  pl?: number;
}

/** 网易云歌单创建者 */
export interface NeteaseApiPlaylistCreator {
  userId: number;
  nickname: string;
  avatarUrl: string;
}

/** 网易云歌单主体 */
export interface NeteaseApiPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount?: number;
  playCount?: number;
  subscribedCount?: number;
  description?: string | null;
  tags?: string[];
  createTime?: number;
  creator?: NeteaseApiPlaylistCreator;
  tracks?: NeteaseApiSong[];
}

/** 网易云歌单详情接口 data */
export interface NeteasePlaylistDetailData {
  code?: number;
  playlist?: NeteaseApiPlaylist;
  privileges?: NeteaseApiPrivilege[];
}

/** 网易云歌单全部歌曲接口 data */
export interface NeteasePlaylistTrackAllData {
  code?: number;
  songs?: NeteaseApiSong[];
  privileges?: NeteaseApiPrivilege[];
}

/** 网易云歌单解析响应 */
export interface ParseNeteasePlaylistResponseData {
  detail: NeteasePlaylistDetailData | null;
  all: NeteasePlaylistTrackAllData | null;
}

/** 网易云单曲解析下载信息 */
export interface ParseNeteaseSongUrl {
  url: string | null;
  size?: number;
  type?: string | null;
  encodeType?: string | null;
  level?: string | null;
}

/** 网易云单曲解析歌词 */
export interface ParseNeteaseSongLyric {
  lrc: string;
  lrcText: string;
}

/** 网易云单曲解析响应 */
export interface ParseNeteaseSongResponseData {
  song: NeteaseApiSong | null;
  download: ParseNeteaseSongUrl | null;
  lyric: ParseNeteaseSongLyric;
}
