import type {
  GetSongInfoParams,
  GetSongInfoResponseData,
  GetVideoInfoParams,
  GetVideoInfoResponseData,
  ParsePlaylistShareLinkResponseData,
  ParseShareLinkParams,
  ParseSongShareLinkResponseData,
} from '@/types/qishui';
import { get } from 'utils/request';

export { reqGetCardSecretBySecret } from './cardSecret';
export {
  reqDeleteParseLog,
  reqGetParseLogById,
  reqListParseLogs,
} from './parseLog';

/**
 * 歌曲分享链接解析
 * @example
 * ```ts
 * const res = await reqParseSongShareLink({ shareLink: 'https://...' });
 * ```
 */
export const reqParseSongShareLink = (params: ParseShareLinkParams) =>
  get<ParseSongShareLinkResponseData>('/qishui/parse-song-share-link', params);

/**
 * 歌单分享链接解析
 * @example
 * ```ts
 * const res = await reqParsePlaylistShareLink({ shareLink: 'https://...' });
 * ```
 */
export const reqParsePlaylistShareLink = (params: ParseShareLinkParams) =>
  get<ParsePlaylistShareLinkResponseData>(
    '/qishui/parse-playlist-share-link',
    params,
  );

/**
 * 根据歌曲 id 获取歌曲信息
 * @example
 * ```ts
 * const res = await reqGetSongInfo({ songId: '7647155900515649577' });
 * ```
 */
export const reqGetSongInfo = (params: GetSongInfoParams) =>
  get<GetSongInfoResponseData>('/qishui/get-song-info', params);

/**
 * 根据视频 id 获取视频歌曲信息
 * @example
 * ```ts
 * const res = await reqGetVideoInfo({ videoId: '7639280897337855278' });
 * ```
 */
export const reqGetVideoInfo = (params: GetVideoInfoParams) =>
  get<GetVideoInfoResponseData>('/qishui/get-video-info', params);
