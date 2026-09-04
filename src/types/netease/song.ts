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
  /** 单曲详情解析结果 */
  parseInfo?: NeteaseSongDetailData;
}

/** 网易云歌曲权限 */
export interface NeteaseApiPrivilege {
  id: number;
  fee?: number;
  st?: number;
  pl?: number;
}

/** 网易云歌词 */
export interface NeteaseSongLyric {
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

/** 获取网易云歌曲详情参数 */
export interface GetNeteaseSongDetailParams {
  id: string;
  level?: NeteaseSoundQualityLevel;
  cardSecret: string;
  getDownloadUrl?: boolean;
}

/** 获取网易云歌曲详情 */
export interface NeteaseSongDetailData {
  detail: {
    song?: NeteaseApiSong;
    privileges?: NeteaseApiPrivilege;
  };
  download: NeteaseSongDownloadData | null;
  lyric: NeteaseSongLyric;
  quality?: NeteaseSongQualityData | null;
}

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
