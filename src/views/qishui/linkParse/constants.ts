/** 链接解析视图类型 */
export type LinkParseView = 'song' | 'playlist';

export const DEFAULT_SONG_LINK =
  '《一点》@汽水音乐 https://qishui.douyin.com/s/ia4MqU3p/';

export const DEFAULT_PLAYLIST_LINK = '歌单｜我喜欢 https://qishui.douyin.com/s/iCU3tCwL/ @汽水音乐';

export const QISHUI_HOME_URL = 'https://qishui.douyin.com/';

/** 下载音质优先阶梯：从高到低，缺失则降一级 */
export const DOWNLOAD_QUALITY_ORDER = [
  'spatial',
  'hi_res',
  'highest',
  'higher',
  'medium',
  'lossless',
  'hq',
  'standard',
] as const;

/** 歌单批量解析并发数 */
export const PLAYLIST_PARSE_CONCURRENCY = 6;
