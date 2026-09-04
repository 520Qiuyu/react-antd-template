import type { NeteaseApiPrivilege, NeteaseApiSong } from './song';

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
