/**
 * 专辑信息接口
 * 包含专辑的各种属性，如专辑ID、名称、发布日期等
 */
export interface AlbumInfo {
  albumMid: string;
  albumName: string;
  albumTranName: string;
  publishDate: string;
  totalNum: number;
  albumType: string;
  pmid: string;
  albumID: number;
  singerName: string;
  tags: null | string[];
}

/**
 * 歌手数据接口
 * 包含歌手的代码和相关数据，如歌手ID和专辑列表
 */
export interface SingerData {
  code: number;
  data: {
    singerMid: string;
    albumList: AlbumInfo[];
    total: number;
  };
}

/**
 * 响应信息接口
 * 包含响应的通用信息，如代码、时间戳、追踪ID等，以及歌手信息
 */
export interface SingerResponseInfo {
  code: number;
  ts: number;
  start_ts: number;
  traceid: string;
  singer: SingerData;
}
