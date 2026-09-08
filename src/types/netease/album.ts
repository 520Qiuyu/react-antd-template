/** 专辑详情中的艺人 */
export interface NeteaseApiAlbumArtist {
  id: number;
  name: string;
  picUrl?: string;
}

/** 网易云专辑详情主体（解析页头部） */
export interface NeteaseApiAlbumInfo {
  id: number;
  name: string;
  picUrl: string;
  publishTime: number;
  company: string | null;
  description: string | null;
  artist: NeteaseApiAlbumArtist;
  size: number;
  type?: string;
  subType?: string;
  alias?: string[];
}
