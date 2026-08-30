/** 网易云解析查询参数 */
export interface ParseNeteaseShareLinkParams {
  shareLink: string;
  cardSecret: string;
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

/** 网易云歌曲音质档位明细 */
export interface NeteaseSongQualityItem {
  br: number;
  fid?: number;
  size: number;
  vd?: number;
  sr: number;
  it?: string;
}

/** 网易云歌曲音质详情（song_music_detail） */
export interface NeteaseSongQualityData {
  songId?: number;
  /** 高品质 320k */
  h?: NeteaseSongQualityItem | null;
  /** 中品质 192k */
  m?: NeteaseSongQualityItem | null;
  /** 标准 128k */
  l?: NeteaseSongQualityItem | null;
  /** 无损 */
  sq?: NeteaseSongQualityItem | null;
  /** Hi-Res */
  hr?: NeteaseSongQualityItem | null;
  /** 杜比全景声 */
  db?: NeteaseSongQualityItem | null;
  /** 超清母带 */
  jm?: NeteaseSongQualityItem | null;
  /** 高清臻音 */
  je?: NeteaseSongQualityItem | null;
  /** 沉浸环绕声 */
  sk?: NeteaseSongQualityItem | null;
  /** 沉浸环绕声多编码 */
  sks?: NeteaseSongQualityItem[] | null;
  /** 臻音全景声 */
  vi?: NeteaseSongQualityItem | null;
}

/** 网易云单曲解析响应 */
export interface ParseNeteaseSongResponseData {
  song: NeteaseApiSong | null;
  download: ParseNeteaseSongUrl | null;
  lyric: ParseNeteaseSongLyric;
  quality?: NeteaseSongQualityData | null;
}

/** 网易云歌曲下载音质档位 */
export type NeteaseSoundQualityLevel =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jyeffect'
  | 'jymaster'
  | 'sky'
  | 'vivid'
  | 'dolby';

/** 获取网易云歌曲下载地址参数 */
export interface GetNeteaseSongDownloadParams {
  id: string;
  level?: NeteaseSoundQualityLevel;
  cardSecret: string;
}

/** 网易云歌曲下载地址 */
export interface NeteaseSongDownloadData {
  id: number;
  url: string | null;
  br?: number;
  size?: number;
  type?: string | null;
  encodeType?: string | null;
  level?: string | null;
  sr?: number;
}
