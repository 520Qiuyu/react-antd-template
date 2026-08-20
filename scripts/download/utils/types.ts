/** 歌单 JSON 中的音质地址项 */
export interface PlaylistUrlItem {
  url?: string;
  quality?: string;
  size?: number;
  format?: string;
  codec?: string;
  encryptionMethod?: string;
  playAuth?: string;
  playAuthID?: string;
}

/** 歌单 JSON 中的曲目 */
export interface PlaylistTrackItem {
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
  duration?: number;
  type?: string;
  urls?: PlaylistUrlItem[];
  lrc?: string;
  lrcText?: string;
}

/** 导出的歌单 JSON 根结构 */
export interface PlaylistExportJson {
  歌单名?: string;
  list?: PlaylistTrackItem[];
}

/** 运行时配置（由 index 常量注入，避免循环依赖） */
export interface DownloadRuntimeConfig {
  preferredQuality: string;
  qualityOrder: readonly string[];
  downloadFormat: 'mp3' | 'm4a' | 'flac';
  nameFormat: string;
  syncLyrics: boolean;
  embedMetadata: boolean;
}
