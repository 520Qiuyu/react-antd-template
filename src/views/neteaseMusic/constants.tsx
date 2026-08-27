import type { NeteaseModeCopy, NeteaseParseMode } from './types';

export const NETEASE_HOME_URL = 'https://music.163.com/';

export const NETEASE_MODES: NeteaseParseMode[] = ['song', 'playlist', 'album', 'artist'];

export const MODE_COPY: Record<NeteaseParseMode, NeteaseModeCopy> = {
  song: {
    badge: 'Song Parse',
    title: '单曲解析',
    titleEn: 'Song',
    lead: '粘贴网易云单曲分享链接，一键提取封面、艺人、专辑、音质地址与歌词，结构清晰、便于后续下载与二次处理。',
    hint: (
      <>
        支持完整分享文案或纯链接，例如：
        <code>海阔天空 https://music.163.com/song?id=347230</code>
      </>
    ),
    placeholder: '粘贴网易云单曲分享链接…',
    defaultLink: '海阔天空 https://music.163.com/song?id=347230',
    parseLabel: '解析单曲',
    inputAria: '单曲分享链接',
    emptyText: '解析结果将显示在这里',
  },
  playlist: {
    badge: 'Playlist Parse',
    title: '歌单解析',
    titleEn: 'Playlist',
    lead: '解析网易云歌单分享链接，展示歌单封面、创建者、曲目数量与完整歌曲列表，支持关键字快速筛选。',
    hint: <>请使用歌单分享链接；单曲链接请切换到「单曲」。</>,
    placeholder: '粘贴网易云歌单分享链接…',
    defaultLink: 'https://music.163.com/playlist?id=3778678',
    parseLabel: '解析歌单',
    inputAria: '歌单分享链接',
    emptyText: '解析结果将显示在这里',
  },
  album: {
    badge: 'Album Parse',
    title: '专辑解析',
    titleEn: 'Album',
    lead: '解析网易云专辑页，展示封面、艺人、发行年份与完整曲目列表，结构和歌单一致、字段对齐专辑。',
    hint: (
      <>
        请使用专辑分享链接，例如：
        <code>https://music.163.com/album?id=31532</code>
      </>
    ),
    placeholder: '粘贴网易云专辑分享链接…',
    defaultLink: 'https://music.163.com/album?id=31532',
    parseLabel: '解析专辑',
    inputAria: '专辑分享链接',
    emptyText: '解析结果将显示在这里',
  },
  artist: {
    badge: 'Artist Parse',
    title: '歌手解析',
    titleEn: 'Artist',
    lead: '解析网易云歌手页，展示头像、地区、热门歌曲与专辑列表，便于从艺人入口继续下钻。',
    hint: (
      <>
        请使用歌手主页分享链接，例如：
        <code>https://music.163.com/artist?id=3691</code>
      </>
    ),
    placeholder: '粘贴网易云歌手分享链接…',
    defaultLink: 'https://music.163.com/artist?id=3691',
    parseLabel: '解析歌手',
    inputAria: '歌手分享链接',
    emptyText: '解析结果将显示在这里',
  },
};

export const BASE_TOC_SECTIONS = [
  { id: 'parse-input', label: '输入链接' },
  { id: 'parse-result', label: '解析结果' },
] as const;

export const GUIDE_TOC_SECTIONS = [
  { id: 'guide-share', label: '如何获取分享链接' },
  { id: 'guide-fields', label: '字段说明' },
] as const;
