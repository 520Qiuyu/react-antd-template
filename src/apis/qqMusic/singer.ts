import { get, post } from 'utils/request';
import { base } from '..';
import type {
  OverallSingerResponseData,
  SingerAlbumResponseData,
  SingerListResponseData,
  SingerFullInfo,
  AlbumInfoResponseData,
  AlbumInfo,
} from '@/types/qqMusic/singer';

// GET getSingerList 获取热门歌手列表
export const getSingerList = (params: any) =>
  get<SingerListResponseData>(`${base}getSingerList`, params);

// GET getSingerDesc 获取歌手信息
export const getSingerDesc = (params: any) => get<string>(`${base}getSingerDesc`, params);

// GET getSingerHotsong 获取歌手热门歌曲
export const getSingerHotsong = (params: {
  /** 歌手id */
  singermid: string;
  /** 页数, 默认为0 */
  page?: number;
  /** 取出歌单数量, 默认为5 */
  limit?: number;
}) => get<OverallSingerResponseData>(`${base}getSingerHotsong`, params);

// GET getSingerStarNum 获取歌手被关注数量信息
export const getSingerStarNum = (params: any) =>
  get<{
    /** 代码 */
    code: number;
    /** 子代码 */
    subcode: number;
    /** 数量 */
    num: number;
    /** 状态 */
    status: number;
    /** 博客标志 */
    blogflag: number;
  }>(`${base}getSingerStarNum`, params);

// GET getSingerAlbum 获取歌手专辑
export const getSingerAlbum = async (params: {
  /** 歌手id */
  singermid: string;
}) => {
  const limit = 80;
  let page = 0;
  const result: AlbumInfo[] = [];
  const res = await get<SingerAlbumResponseData>(`${base}getSingerAlbum`, {
    ...params,
    limit,
    page,
  });
  const total = res.response?.singer?.data?.total;
  result.push(...res.response?.singer?.data?.albumList);

  while (result.length < total) {
    page = page + limit;
    const nextRes = await get<SingerAlbumResponseData>(`${base}getSingerAlbum`, {
      ...params,
      limit,
      page,
    });
    result.push(...nextRes.response?.singer?.data?.albumList);
  }
  return {
    status: 200,
    response: {
      albumList: result,
    },
  };
};

// 获取歌手头像
export const getSingerAvatar = (singerMid: string) =>
  `https://y.qq.com/music/photo_new/T001R800x800M000${singerMid}.jpg`;
// 获取专辑图片
export const getAlbumCover = (albumMid: string) =>
  `https://y.qq.com/music/photo_new/T002R800x800M000${albumMid}.jpg`;

// GET getAlbumInfo 获取专辑信息
export const getAlbumInfo = (params: {
  /** 专辑id */
  albummid: string;
}) => get<AlbumInfoResponseData>(`${base}getAlbumInfo`, params);

// GET getMusicPlay 获取歌曲播放链接
export const getMusicPlay = (params: {
  /** 歌曲id, 多个播放链接使用,分隔 */
  songmid: string;
  /** 仅返回播放链接, 默认是 play。[all | play] */
  justPlayUrl?: 'all' | 'play';
  /** 播放品质, 默认是 128。[m4a | 128 | 320 | ape | flac] */
  quality?: 'm4a' | '128' | '320' | 'ape' | 'flac';
  /** 是否返回播放链接, 默认是 true。[true | false] */
  returnPlayUrl?: boolean;
}) =>
  get<{
    /** 代码 */
    code: number;
    /** 子代码 */
    subcode: number;
    /** 数据 */
    data: {
      /** 播放链接 */
      playUrl: string;
    };
  }>(`${base}getMusicPlay`, {
    quality: 'flac',
    justPlayUrl: 'play',
    returnPlayUrl: true,
    ...params,
  });

// GET getLyric 获取歌曲歌词
export const getLyric = (params: {
  /** 歌曲id */
  songmid: string;
  /** 是否格式化歌词, 默认值为 false */
  isFormat?: boolean;
}) =>
  get<{
    /** 返回码 */
    retcode: number;
    /** 代码 */
    code: number;
    /** 子代码 */
    subcode: number;
    /** 歌词内容 */
    lyric: string;
    /** 翻译歌词 */
    trans: string;
  }>(`${base}getLyric`, {
    ...params,
  });
