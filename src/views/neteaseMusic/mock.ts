import type {
  NeteaseAlbumInfo,
  NeteaseArtistInfo,
  NeteasePlaylistInfo,
  NeteaseSongInfo,
  NeteaseTrack,
} from './types';

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
  id: string,
  title: string,
  artist: string,
  album: string,
  duration: number,
  preview = false,
): NeteaseTrack => ({
  id,
  title,
  artist,
  album,
  cover: PLACEHOLDER_COVER,
  duration,
  isPreviewOnly: preview,
  previewDuration: preview ? 30 : undefined,
});

/** 演示用单曲数据 */
export const MOCK_SONG: NeteaseSongInfo = {
  trackId: '347230',
  title: '海阔天空',
  artist: 'Beyond',
  artists: [{ id: '1', name: 'Beyond', avatar: PLACEHOLDER_COVER }],
  album: '海阔天空',
  cover: PLACEHOLDER_COVER,
  urls: [
    {
      quality: 'standard',
      format: 'mp3',
      size: 4128768,
      url: '',
      encryptionMethod: 'none',
      br: 128000,
      sr: 44100,
    },
    {
      quality: 'higher',
      format: 'mp3',
      size: 8257536,
      url: '',
      encryptionMethod: 'none',
      br: 192000,
      sr: 44100,
    },
    {
      quality: 'exhigh',
      format: 'mp3',
      size: 12800000,
      url: 'https://example.com/exhigh.mp3',
      encryptionMethod: 'none',
      br: 320000,
      sr: 44100,
      playable: true,
    },
    {
      quality: 'lossless',
      format: 'flac',
      size: 31256832,
      url: '',
      encryptionMethod: 'none',
      br: 999000,
      sr: 44100,
    },
  ],
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
};

/** 演示用歌单数据 */
export const MOCK_PLAYLIST: NeteasePlaylistInfo = {
  id: '3778678',
  title: '云音乐热歌榜',
  cover: PLACEHOLDER_COVER,
  owner: '网易云音乐',
  countTracks: 8,
  tracks: [
    track('t1', '海阔天空', 'Beyond', '海阔天空', 326),
    track('t2', '起风了', '买辣椒也用券', '起风了', 311),
    track('t3', '消愁', '毛不易', '平凡的一天', 265, true),
    track('t4', '如愿', '王菲', '如愿', 278),
    track('t5', '光年之外', 'G.E.M. 邓紫棋', '光年之外', 235),
    track('t6', '告白气球', '周杰伦', '周杰伦的床边故事', 215),
    track('t7', '体面', '于文文', '体面', 251, true),
    track('t8', '孤勇者', '陈奕迅', '孤勇者', 256),
  ],
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
    track('a1', '海阔天空', 'Beyond', '海阔天空', 326),
    track('a2', '光辉岁月', 'Beyond', '海阔天空', 302),
    track('a3', '真的爱你', 'Beyond', '海阔天空', 278),
    track('a4', '喜欢你', 'Beyond', '海阔天空', 239),
    track('a5', '不再犹豫', 'Beyond', '海阔天空', 251, true),
    track('a6', '大地', 'Beyond', '海阔天空', 268),
    track('a7', '谁伴我闯荡', 'Beyond', '海阔天空', 244),
    track('a8', '灰色轨迹', 'Beyond', '海阔天空', 287),
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
    track('h1', '海阔天空', 'Beyond', '海阔天空', 326),
    track('h2', '光辉岁月', 'Beyond', '海阔天空', 302),
    track('h3', '真的爱你', 'Beyond', '真的爱你', 278),
    track('h4', '喜欢你', 'Beyond', '秘密警察', 239),
    track('h5', '不再犹豫', 'Beyond', '命运派对', 251, true),
    track('h6', '大地', 'Beyond', '信念', 268),
    track('h7', '谁伴我闯荡', 'Beyond', '命运派对', 244),
    track('h8', '灰色轨迹', 'Beyond', 'Continue The Struggle', 287),
  ],
  albums: [
    { id: 'al1', title: '海阔天空', year: '1993', cover: PLACEHOLDER_COVER },
    { id: 'al2', title: '乐与怒', year: '1993', cover: PLACEHOLDER_COVER },
    { id: 'al3', title: '命运派对', year: '1990', cover: PLACEHOLDER_COVER },
    { id: 'al4', title: 'Beyond IV', year: '1989', cover: PLACEHOLDER_COVER },
  ],
};
