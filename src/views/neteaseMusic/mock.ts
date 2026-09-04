import type { NeteaseApiSong, ParseNeteasePlaylistResponseData, ParseNeteaseSongResponseData } from '@/types/netease';
import type { NeteaseAlbumInfo, NeteaseArtistInfo } from './types';

export const PLACEHOLDER_COVER =
  'data:image/svg+xml,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#C20C0C"/>
          <stop offset="0.62" stop-color="#8A0E0E"/>
          <stop offset="1" stop-color="#4A1010"/>
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#g)"/>
      <circle cx="150" cy="150" r="54" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="8"/>
      <path d="M168 118v72a22 22 0 1 1-14-20.5V142l14-8z" fill="rgba(255,255,255,.88)"/>
    </svg>
  `);

const track = (
  id: number,
  name: string,
  artist: string,
  album: string,
  duration: number,
  preview = false,
): NeteaseApiSong => ({
  id,
  name,
  ar: [{ id: 1, name: artist }],
  al: { id: 1, name: album, picUrl: PLACEHOLDER_COVER },
  dt: duration * 1000,
  noCopyrightRcmd: preview ? {} : null,
});

/** 演示用单曲数据 */
export const MOCK_SONG: ParseNeteaseSongResponseData = {
  song: {
    id: 347230,
    name: '海阔天空',
    ar: [{ id: 1, name: 'Beyond' }],
    al: { id: 1, name: '海阔天空', picUrl: PLACEHOLDER_COVER },
  },
  download: null,
  lyric: {
    lrc: `[ti:海阔天空]
[ar:Beyond]
[00:12.00]这是原型占位歌词
[00:16.40]用来预览歌词盒的排版
[00:21.10]朱漆红落在宣纸上
[00:26.80]把分享链接轻轻放进输入框
[00:32.00]封面、音质、歌词依次展开
[00:36.50]像翻开一页云村文档`,
    lrcText:
      '这是原型占位歌词\n用来预览歌词盒的排版\n朱漆红落在宣纸上\n把分享链接轻轻放进输入框\n封面、音质、歌词依次展开\n像翻开一页云村文档',
  },
  quality: {
    h: { br: 320000, size: 12800000, sr: 44100, it: 'mp3' },
    m: { br: 192000, size: 8257536, sr: 44100, it: 'mp3' },
    l: { br: 128000, size: 4128768, sr: 44100, it: 'mp3' },
    sq: { br: 999000, size: 31256832, sr: 44100, it: 'flac' },
  },
};

/** 演示用歌单数据 */
export const MOCK_PLAYLIST: ParseNeteasePlaylistResponseData = {
  detail: {
    playlist: {
      id: 3778678,
      name: '云音乐热歌榜',
      coverImgUrl: PLACEHOLDER_COVER,
      trackCount: 8,
      playCount: 12345678,
      creator: {
        userId: 1,
        nickname: '网易云音乐',
        avatarUrl: PLACEHOLDER_COVER,
      },
      tags: ['华语', '流行'],
      createTime: Date.now(),
    },
  },
  all: {
    songs: [
      track(1, '海阔天空', 'Beyond', '海阔天空', 326),
      track(2, '起风了', '买辣椒也用券', '起风了', 311),
      track(3, '消愁', '毛不易', '平凡的一天', 265, true),
      track(4, '如愿', '王菲', '如愿', 278),
      track(5, '光年之外', 'G.E.M. 邓紫棋', '光年之外', 235),
      track(6, '告白气球', '周杰伦', '周杰伦的床边故事', 215),
      track(7, '体面', '于文文', '体面', 251, true),
      track(8, '孤勇者', '陈奕迅', '孤勇者', 256),
    ],
  },
};

/** 演示用专辑数据 */
export const MOCK_ALBUM: NeteaseAlbumInfo = {
  id: '31532',
  title: '海阔天空',
  artist: 'Beyond',
  cover: PLACEHOLDER_COVER,
  year: '1993',
  company: '华星唱片',
  countTracks: 8,
  tracks: [
    track(1, '海阔天空', 'Beyond', '海阔天空', 326),
    track(2, '光辉岁月', 'Beyond', '海阔天空', 302),
    track(3, '真的爱你', 'Beyond', '海阔天空', 278),
    track(4, '喜欢你', 'Beyond', '海阔天空', 239),
    track(5, '不再犹豫', 'Beyond', '海阔天空', 251, true),
    track(6, '大地', 'Beyond', '海阔天空', 268),
    track(7, '谁伴我闯荡', 'Beyond', '海阔天空', 244),
    track(8, '灰色轨迹', 'Beyond', '海阔天空', 287),
  ],
};

/** 演示用歌手数据 */
export const MOCK_ARTIST: NeteaseArtistInfo = {
  id: '3691',
  name: 'Beyond',
  alias: '黄家驹 / 黄贯中 / 黄家强 / 叶世荣',
  area: '香港',
  avatar: PLACEHOLDER_COVER,
  songCount: 186,
  albumCount: 24,
  hotSongs: [
    track(1, '海阔天空', 'Beyond', '海阔天空', 326),
    track(2, '光辉岁月', 'Beyond', '海阔天空', 302),
    track(3, '真的爱你', 'Beyond', '真的爱你', 278),
    track(4, '喜欢你', 'Beyond', '秘密警察', 239),
    track(5, '不再犹豫', 'Beyond', '命运派对', 251, true),
    track(6, '大地', 'Beyond', '信念', 268),
    track(7, '谁伴我闯荡', 'Beyond', '命运派对', 244),
    track(8, '灰色轨迹', 'Beyond', 'Continue The Struggle', 287),
  ],
  albums: [
    { id: 'al1', title: '海阔天空', year: '1993', cover: PLACEHOLDER_COVER },
    { id: 'al2', title: '乐与怒', year: '1993', cover: PLACEHOLDER_COVER },
    { id: 'al3', title: '命运派对', year: '1990', cover: PLACEHOLDER_COVER },
    { id: 'al4', title: 'Beyond IV', year: '1989', cover: PLACEHOLDER_COVER },
  ],
};
