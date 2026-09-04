import type {
  ParseNeteasePlaylistResponseData,
  ParseNeteaseShareLinkParams,
  ParseNeteaseSongResponseData,
} from '@/types/netease/parse';
import { get } from 'utils/request';

/**
 * 网易云单曲解析
 * @example
 * ```ts
 * const res = await reqParseNeteaseSong({ shareLink: 'https://music.163.com/song?id=347230' });
 * ```
 */
export const reqParseNeteaseSong = (params: ParseNeteaseShareLinkParams) =>
  get<ParseNeteaseSongResponseData>('/netease/parse/song', params);

/**
 * 网易云歌单解析
 * @example
 * ```ts
 * const res = await reqParseNeteasePlaylist({ shareLink: 'https://music.163.com/playlist?id=3778678' });
 * ```
 */
export const reqParseNeteasePlaylist = (params: ParseNeteaseShareLinkParams) =>
  get<ParseNeteasePlaylistResponseData>('/netease/parse/playlist', params);
