import type { ReactNode } from 'react';

/** 网易云解析类型 */
export type NeteaseParseMode = 'song' | 'playlist' | 'album' | 'artist';

/** 本页目录项 */
export interface TocSection {
  id: string;
  label: string;
}

/** 音质条目 */
export interface NeteaseUrl {
  quality: string;
  format: string;
  size: number;
  url: string;
  encryptionMethod: string;
}

/** 艺人摘要 */
export interface NeteaseArtistBrief {
  id: string;
  name: string;
  avatar: string;
}

/** 列表曲目 */
export interface NeteaseTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
  isPreviewOnly?: boolean;
  previewDuration?: number;
}

/** 单曲解析结果 */
export interface NeteaseSongInfo {
  trackId: string;
  title: string;
  artist: string;
  artists: NeteaseArtistBrief[];
  album: string;
  cover: string;
  urls: NeteaseUrl[];
  lrc: string;
  lrcText: string;
}

/** 歌单解析结果 */
export interface NeteasePlaylistInfo {
  id: string;
  title: string;
  cover: string;
  owner: string;
  countTracks: number;
  tracks: NeteaseTrack[];
}

/** 专辑解析结果 */
export interface NeteaseAlbumInfo {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: string;
  company: string;
  countTracks: number;
  tracks: NeteaseTrack[];
}

/** 歌手专辑卡片 */
export interface NeteaseArtistAlbum {
  id: string;
  title: string;
  year: string;
  cover: string;
}

/** 歌手解析结果 */
export interface NeteaseArtistInfo {
  id: string;
  name: string;
  alias: string;
  area: string;
  avatar: string;
  songCount: number;
  albumCount: number;
  hotSongs: NeteaseTrack[];
  albums: NeteaseArtistAlbum[];
}

/** 各解析页文案 */
export interface NeteaseModeCopy {
  badge: string;
  title: string;
  titleEn: string;
  lead: string;
  hint: ReactNode;
  placeholder: string;
  defaultLink: string;
  parseLabel: string;
  inputAria: string;
  emptyText: string;
}
