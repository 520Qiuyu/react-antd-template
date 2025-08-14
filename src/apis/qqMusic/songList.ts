import { get, post } from 'utils/request';
import { base } from '..';
import type { CategoryGroup, SongListCategoriesResponseData } from '@/types/qqMusic/songList';

/**
 * 获取歌单分类
 * @description 获取歌单分类信息，包含category信息
 * @example
 * ```ts
 * const categories = await getSongListCategories()
 * ```
 */
export const getSongListCategories = () => {
  return get<SongListCategoriesResponseData>(`${base}getSongListCategories`);
};

/**
 * 批量获取歌单列表
 * @description 根据分类ID批量获取歌单列表信息
 * @example
 * ```ts
 * const songLists = await batchGetSongLists({
 *   categoryIds: [167, 168],
 *   page: 1,
 *   limit: 20,
 *   sortId: 5
 * })
 * ```
 */
export const batchGetSongLists = (params: {
  /** 类别id列表 */
  categoryIds: number[];
  /** 当前页数, 默认为1 */
  page?: number;
  /** 取出歌单数量, 默认为20 */
  limit?: number;
  /** 排序方式(最新/最热/评分), 默认为5 */
  sortId?: number;
}) => {
  return post<any>(`${base}batchGetSongLists`, params);
};
