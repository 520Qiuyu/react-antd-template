/** 链接解析视图类型 */
export type LinkParseView = 'song' | 'playlist';

export const DEFAULT_SONG_LINK =
  '《一点》@汽水音乐 https://qishui.douyin.com/s/ia4MqU3p/';

export const DEFAULT_PLAYLIST_LINK = '歌单｜我喜欢 https://qishui.douyin.com/s/iCU3tCwL/ @汽水音乐';

export const QISHUI_HOME_URL = 'https://qishui.douyin.com/';

/** 飞书使用教程（含操作视频） */
export const HELP_DOC_URL =
  'https://mcn92zvlb0tb.feishu.cn/wiki/AU1zwhsMoi531lkn5rmcrGX8nlc?from=from_copylink';

/** 首次帮助提示已展示标记 */
export const HELP_TIP_SEEN_KEY = 'lp-help-tip-seen';

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
