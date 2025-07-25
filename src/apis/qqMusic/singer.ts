import { get, post } from 'utils/request';
import { base } from '..';
import type {
  OverallSingerResponseData,
  SingerAlbumResponseData,
  SingerListResponseData,
  SingerFullInfo,
  AlbumInfoResponseData,
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
export const getSingerAlbum = (params: {
  /** 歌手id */
  singermid: string;
  /** 当前页数, 默认为1 */
  page?: number;
  /** 取出歌单数量, 默认为20 */
  limit?: number;
}) => get<SingerAlbumResponseData>(`${base}getSingerAlbum`, params);

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
