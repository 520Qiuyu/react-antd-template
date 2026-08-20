/** 音质播放地址 */
export interface QishuiUrl {
  url: string;
  quality: string;
  size: number;
  format: string;
  codec: string;
  encryptionMethod: string;
  playAuth?: string;
  playAuthID?: string;
}

/** 歌曲艺人 */
export interface MusicArtist {
  id: string;
  name: string;
  avatar?: string;
}

/** 歌曲信息 */
export interface MusicInfo {
  /** 媒体类型：歌曲分享页 / ugc 视频分享页 */
  type?: 'track' | 'video';
  trackId?: string;
  title?: string;
  artist?: string;
  artists?: MusicArtist[];
  album?: string;
  cover?: string;
  urls?: QishuiUrl[];
  lrc?: string;
  lrcText?: string;
}

/** 歌单内歌曲信息 */
export interface PlaylistMusicInfo {
  type?: 'track' | 'video';
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
  duration?: number;
  previewDuration?: number;
  isPreviewOnly?: boolean;
  collectCount?: number;
  commentCount?: number;
  shareCount?: number;
  /** 单曲详情解析结果（get-song-info） */
  fullInfo?: MusicInfo | null;
}

/** 歌单信息 */
export interface PlaylistInfo {
  id?: string;
  title: string;
  cover: string;
  owner: string;
  countTracks: number;
  tracks: PlaylistMusicInfo[];
}

/** 分享链接解析查询参数 */
export interface ParseShareLinkParams {
  shareLink: string;
  cardSecret: string;
}

/** 歌曲分享链接解析响应 */
export interface ParseSongShareLinkResponseData {
  shareLink: string;
  musicInfo: MusicInfo;
  fullInfo?: MusicInfo | null;
}

/** 歌单分享链接解析响应 */
export interface ParsePlaylistShareLinkResponseData {
  shareLink: string;
  /** 后端字段名仍为 routerData，实际为歌单信息 */
  routerData: PlaylistInfo;
}

/** 根据歌曲 id 查询参数 */
export interface GetSongInfoParams {
  songId: string;
  cardSecret: string;
}

/** 根据歌曲 id 获取歌曲信息响应 */
export interface GetSongInfoResponseData {
  songId: string;
  fullInfo: MusicInfo | null;
}

/** 根据视频 id 查询参数 */
export interface GetVideoInfoParams {
  videoId: string;
  cardSecret: string;
}

/** 根据视频 id 获取视频歌曲信息响应 */
export interface GetVideoInfoResponseData {
  videoId: string;
  fullInfo: MusicInfo | null;
}
