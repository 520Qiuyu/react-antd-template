import type { NeteaseApiSong } from '@/types/netease';
import type { ReactNode } from 'react';

/** 网易云解析类型 */
export type NeteaseParseMode = 'song' | 'playlist' | 'album' | 'artist';

/** 本页目录项 */
export interface TocSection {
  id: string;
  label: string;
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
  tracks: NeteaseApiSong[];
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
  hotSongs: NeteaseApiSong[];
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
