import type {
  ParseNeteasePlaylistResponseData,
  ParseNeteaseShareLinkParams,
} from '@/types/netease';
import { get } from 'utils/request';

/**
 * 网易云歌单解析
 * @example
 * ```ts
 * const res = await reqParseNeteasePlaylist({ shareLink: 'https://music.163.com/playlist?id=3778678' });
 * ```
 */
export const reqParseNeteasePlaylist = (params: ParseNeteaseShareLinkParams) =>
  get<ParseNeteasePlaylistResponseData>('/netease/parse/playlist', params);
