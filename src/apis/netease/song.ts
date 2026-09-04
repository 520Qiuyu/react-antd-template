import type {
  GetNeteaseSongDetailParams,
  GetNeteaseSongDownloadParams,
  NeteaseSongDetailData,
  NeteaseSongDownloadData,
} from '@/types/netease/song';
import { get } from 'utils/request';

/**
 * 获取网易云歌曲详情（可选同时拉取下载地址）
 * @example
 * ```ts
 * const res = await reqGetNeteaseSongDetail({ id: '347230', cardSecret, getDownloadUrl: true });
 * ```
 */
export const reqGetNeteaseSongDetail = (params: GetNeteaseSongDetailParams) =>
  get<NeteaseSongDetailData>('/netease/song/detail', params);

/**
 * 获取网易云歌曲指定音质下载地址
 * @example
 * ```ts
 * const res = await reqGetNeteaseSongDownload({ id: '347230', level: 'lossless' });
 * ```
 */
export const reqGetNeteaseSongDownload = (params: GetNeteaseSongDownloadParams) =>
  get<NeteaseSongDownloadData>('/netease/song/download', params);
