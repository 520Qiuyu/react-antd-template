import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AppDispatch } from '../store';
import { getAlbumCover, getAlbumInfo, getMusicPlay } from '@/apis/qqMusic/singer';

interface Singer {
  id: number;
  mid: string;
  name: string;
}

interface Album {
  mid: string;
  name: string;
  time_public?: string;
  cover?: string;
}

interface SongInfo {
  id: number;
  mid: string;
  name: string;
  subtitle?: string;
  url?: string;
  interval: number;
  singer?: Singer[];
  album?: Album;
}

// 播放模式
export const PlayMode = {
  /** 顺序播放 */
  SEQUENCE: 'sequence',
  /** 单曲循环 */
  SINGLE_CYCLE: 'singleCycle',
  /** 随机播放 */
  RANDOM: 'random',
} as const;

export type PlayMode = typeof PlayMode[keyof typeof PlayMode];

export const musicSlice = createSlice({
  name: 'music',
  initialState: {
    // 播放列表
    playList: [
      {
        id: 4830342,
        mid: '001OyHbk2MSIi4',
        name: '十年',
        subtitle: '',
        singer: [{ id: 143, mid: '003Nz2So3XXYek', name: '陈奕迅' }],
        album: {
          mid: '000GDz8k03UOaI',
          name: '黑白灰',
          time_public: '2003-04-15',
          cover: 'https://p2.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
        },
        interval: 205,
        url: 'http://isure.stream.qqmusic.qq.com/M500001dXZ352YGvqU.mp3?guid=4503634678&vkey=BF949956FB76943D4933879CD3673C81DDF047E62B530E54C4606F1C2D763FEBAD13BB4F8B5012A0D47899BC9ABDD293E633BFB32F566FBE__v2b9aaf3c&uin=1943684871&fromtag=120042',
      },
    ] as SongInfo[],
    // 当前播放歌曲
    currentSong: {
      id: 4830342,
      mid: '001OyHbk2MSIi4',
      name: '十年',
      subtitle: '',
      singer: [{ id: 143, mid: '003Nz2So3XXYek', name: '陈奕迅' }],
      album: {
        mid: '000GDz8k03UOaI',
        name: '黑白灰',
        time_public: '2003-04-15',
        cover: 'https://p2.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
      },
      interval: 205,
      url: 'http://isure.stream.qqmusic.qq.com/M500001dXZ352YGvqU.mp3?guid=4503634678&vkey=BF949956FB76943D4933879CD3673C81DDF047E62B530E54C4606F1C2D763FEBAD13BB4F8B5012A0D47899BC9ABDD293E633BFB32F566FBE__v2b9aaf3c&uin=1943684871&fromtag=120042',
    } as SongInfo | null,
    // 当前播放歌曲索引
    currentSongIndex: 0,
    // 是否播放
    isPlaying: false,
    // 播放模式
    playMode: PlayMode.SEQUENCE as PlayMode,
  },
  reducers: {
    // 设置播放列表
    setPlayList: (state, action) => {
      state.playList = action.payload;
    },
    // 添加到播放列表
    addToPlayList: (state, action: PayloadAction<SongInfo>) => {
      state.playList.push(action.payload);
    },
    // 删除播放列表
    deleteFromPlayList: (state, action) => {
      state.playList = state.playList.filter((song) => song.id !== action.payload);
    },
    // 清空播放列表
    clearPlayList: (state) => {
      state.playList = [];
    },
    // 设置当前播放歌曲
    setCurrentSong: (state, action) => {
      state.currentSong = action.payload;
      state.isPlaying = true;
    },
    // 设置当前播放歌曲索引
    setCurrentSongIndex: (state, action) => {
      state.currentSongIndex = action.payload;
    },
    // 设置是否播放
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    // 设置播放模式
    setPlayMode: (state, action: PayloadAction<PlayMode>) => {
      state.playMode = action.payload;
    },
  },
});

// 为每个reducer生成action creators
export const {
  setPlayList,
  addToPlayList,
  setCurrentSong,
  setCurrentSongIndex,
  setIsPlaying,
  setPlayMode,
} = musicSlice.actions;

// 异步action
export const addToPlayListAsync = (song: SongInfo) => async (dispatch: AppDispatch) => {
  const { url, mid, album } = song;
  const newSong = { ...song };
  // 有无播放链接
  if (!url) {
    const res: any = await getMusicPlay({ songmid: mid });
    console.log('res', res);
    const urlData = res.data.playUrl[mid];
    if (!urlData.error) newSong.url = urlData.url;
  }
  // 有无专辑封面
  if (album && !album.cover) {
    newSong.album!.cover = getAlbumCover(album.mid);
  }
  console.log('添加到仓库song', newSong);
  dispatch(addToPlayList(newSong));
  return newSong;
};

// 播放控制相关的异步action
export const playNextSong = () => (dispatch: AppDispatch, getState: () => any) => {
  const { playList, currentSongIndex, playMode } = getState().music;
  if (!playList.length) return;

  let nextIndex = currentSongIndex;
  switch (playMode) {
    case PlayMode.SEQUENCE:
      // 顺序播放，到最后一首就回到第一首
      nextIndex = currentSongIndex + 1;
      if (nextIndex >= playList.length) {
        nextIndex = 0;
      }
      break;
    case PlayMode.SINGLE_CYCLE:
      // 单曲循环，索引不变
      break;
    case PlayMode.RANDOM:
      // 随机播放
      nextIndex = Math.floor(Math.random() * playList.length);
      break;
    default:
      break;
  }

  dispatch(setCurrentSongIndex(nextIndex));
  dispatch(setCurrentSong(playList[nextIndex]));
};

export const playPrevSong = () => (dispatch: AppDispatch, getState: () => any) => {
  const { playList, currentSongIndex, playMode } = getState().music;
  if (!playList.length) return;

  let prevIndex = currentSongIndex;
  switch (playMode) {
    case PlayMode.SEQUENCE:
      // 顺序播放，到第一首就回到最后一首
      prevIndex = currentSongIndex - 1;
      if (prevIndex < 0) {
        prevIndex = playList.length - 1;
      }
      break;
    case PlayMode.SINGLE_CYCLE:
      // 单曲循环，索引不变
      break;
    case PlayMode.RANDOM:
      // 随机播放
      prevIndex = Math.floor(Math.random() * playList.length);
      break;
    default:
      break;
  }

  dispatch(setCurrentSongIndex(prevIndex));
  dispatch(setCurrentSong(playList[prevIndex]));
};

// 将reducer导出去
export default musicSlice.reducer;
