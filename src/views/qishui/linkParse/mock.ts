import type { MusicInfo, PlaylistInfo } from '@/types/qishui';

/** 占位封面 SVG Data URI */
export const PLACEHOLDER_COVER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#00c27a"/><stop offset="0.5" stop-color="#00b8d4"/><stop offset="1" stop-color="#ffb020"/>
      </linearGradient></defs>
      <rect width="300" height="300" fill="url(#g)"/>
      <circle cx="150" cy="150" r="54" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="8"/>
      <circle cx="150" cy="150" r="16" fill="rgba(255,255,255,.75)"/>
    </svg>`,
  );

/** 演示用歌曲数据（对齐 MusicInfo） */
export const MOCK_SONG: MusicInfo = {
  trackId: '7647155900515649577',
  title: '一点',
  artist: '徐梦洁,Muyoi',
  artists: [{ id: '1', name: '徐梦洁', avatar: PLACEHOLDER_COVER }],
  album: '一点',
  cover: PLACEHOLDER_COVER,
  urls: [
    {
      quality: 'standard',
      format: 'mp3',
      size: 3842910,
      url: 'https://example.com/std.mp3',
      encryptionMethod: 'none',
    },
    {
      quality: 'higher',
      format: 'mp3',
      size: 7681024,
      url: 'https://example.com/high.mp3',
      encryptionMethod: 'none',
    },
    {
      quality: 'lossless',
      format: 'flac',
      size: 28400128,
      url: 'https://example.com/flac.flac',
      encryptionMethod: 'none',
    },
  ],
  lrc: `[ti:一点]
[ar:徐梦洁,Muyoi]
[00:12.00]风吹过的夜里
[00:16.40]你说想听一点
[00:21.10]像汽水泡泡轻轻升起
[00:26.80]又轻轻落进海里
[00:32.00]我想把这瞬间
[00:36.50]存成可分享的旋律
[00:41.20]然后把链接
[00:44.00]留给下一个路过的你`,
  lrcText:
    '风吹过的夜里\n你说想听一点\n像汽水泡泡轻轻升起\n又轻轻落进海里\n我想把这瞬间\n存成可分享的旋律\n然后把链接\n留给下一个路过的你',
};

/** 演示用歌单数据（对齐 PlaylistInfo） */
export const MOCK_PLAYLIST: PlaylistInfo = {
  id: 'pl_884021156',
  title: '深夜汽水 · 轻声放一点',
  cover: PLACEHOLDER_COVER,
  owner: '汽水用户_小绿',
  countTracks: 8,
  tracks: [
    {
      id: 't1',
      title: '一点',
      artist: '徐梦洁 / Muyoi',
      album: '一点',
      cover: PLACEHOLDER_COVER,
      duration: 218,
      isPreviewOnly: false,
    },
    {
      id: 't2',
      title: '蓝色气泡',
      artist: '匿名城',
      album: '夏日汽水',
      cover: PLACEHOLDER_COVER,
      duration: 196,
      isPreviewOnly: false,
    },
    {
      id: 't3',
      title: '窗边雨',
      artist: '林野',
      album: '静夜集',
      cover: PLACEHOLDER_COVER,
      duration: 243,
      isPreviewOnly: true,
      previewDuration: 30,
    },
    {
      id: 't4',
      title: '慢走的街灯',
      artist: '北巷',
      album: '城市边角',
      cover: PLACEHOLDER_COVER,
      duration: 205,
      isPreviewOnly: false,
    },
    {
      id: 't5',
      title: '未发送的草稿',
      artist: '阿澄',
      album: 'Inbox',
      cover: PLACEHOLDER_COVER,
      duration: 187,
      isPreviewOnly: false,
    },
    {
      id: 't6',
      title: '薄荷海风',
      artist: 'Tide',
      album: 'Coast',
      cover: PLACEHOLDER_COVER,
      duration: 231,
      isPreviewOnly: false,
    },
    {
      id: 't7',
      title: '直到清晨',
      artist: '徐梦洁',
      album: '一点',
      cover: PLACEHOLDER_COVER,
      duration: 262,
      isPreviewOnly: true,
      previewDuration: 30,
    },
    {
      id: 't8',
      title: '回声房间',
      artist: 'Room 404',
      album: 'Echo',
      cover: PLACEHOLDER_COVER,
      duration: 174,
      isPreviewOnly: false,
    },
  ],
};
