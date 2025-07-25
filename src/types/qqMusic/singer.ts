/**
 * 歌手信息接口
 * 包含歌手的国家、ID、中间ID、名称和图片链接等信息
 */
export interface SingerInfo {
  country: string;
  singer_id: number;
  singer_mid: string;
  singer_name: string;
  singer_pic: string;
}

/**
 * 标签选项接口
 * 包含标签的ID和名称
 */
export interface TagOption {
  id: number;
  name: string;
}

/**
 * 标签接口
 * 包含地区、流派、索引和性别的标签选项数组
 */
export interface Tags {
  area: TagOption[];
  genre: TagOption[];
  index: TagOption[];
  sex: TagOption[];
}

/**
 * 歌手列表数据接口
 * 包含区域、流派、索引、性别、歌手列表、标签和总数等信息
 */
export interface SingerListData {
  area: number;
  genre: number;
  index: number;
  sex: number;
  singerlist: SingerInfo[];
  tags: Tags;
  total: number;
}

/**
 * 歌手列表响应数据接口
 * 包含代码和歌手列表数据
 */
export interface SingerListResponse {
  code: number;
  data: SingerListData;
}

/**
 * 响应数据接口
 * 包含状态码、响应信息，响应信息中包含代码、时间戳、追踪ID和歌手列表
 */
export interface SingerListResponseData {
  code: number;
  ts: number;
  start_ts: number;
  traceid: string;
  singerList: SingerListResponse;
}

/**
 * 歌曲文件信息接口
 * 包含歌曲文件的各种格式的大小、链接等信息
 */
export interface SongFileInfo {
  media_mid: string;
  size_24aac: number;
  size_48aac: number;
  size_96aac: number;
  size_192ogg: number;
  size_192aac: number;
  size_128mp3: number;
  size_320mp3: number;
  size_ape: number;
  size_flac: number;
  size_dts: number;
  size_try: number;
  try_begin: number;
  try_end: number;
  url: string;
  size_hires: number;
  hires_sample: number;
  hires_bitdepth: number;
  b_30s: number;
  e_30s: number;
  size_96ogg: number;
}

/**
 * 歌曲付费信息接口
 * 包含歌曲付费的相关设置，如付费月数、价格等
 */
export interface SongPayInfo {
  pay_month: number;
  price_track: number;
  price_album: number;
  pay_play: number;
  pay_down: number;
  pay_status: number;
  time_free: number;
}

/**
 * 歌曲操作信息接口
 * 包含歌曲操作相关的开关、消息ID等信息
 */
export interface SongActionInfo {
  switch: number;
  msgid: number;
  alert: number;
  icons: number;
  msgshare: number;
  msgfav: number;
  msgdown: number;
  msgpay: number;
}

/**
 * 歌曲KSong信息接口
 * 包含KSong的ID和中间ID
 */
export interface KSongInfo {
  id: number;
  mid: string;
}

/**
 * 歌曲音量信息接口
 * 包含歌曲音量的增益、峰值和LRA等信息
 */
export interface SongVolumeInfo {
  gain: number;
  peak: number;
  lra: number;
}

/**
 * 歌曲MV信息接口
 * 包含MV的ID、视频ID等信息
 */
export interface SongMVInfo {
  id: number;
  vid: string;
  name: string;
  title: string;
  vt: number;
}

/**
 * 歌曲专辑信息接口
 * 包含专辑的ID、中间ID、名称等信息
 */
export interface SongAlbumInfo {
  id: number;
  mid: string;
  name: string;
  title: string;
  subtitle: string;
  time_public: string;
  pmid: string;
}

/**
 * 歌手信息接口
 * 包含歌手的ID、中间ID、名称等信息
 */
export interface SingerSimpleInfo {
  id: number;
  mid: string;
  name: string;
  title: string;
  type: number;
  uin: number;
}

/**
 * 歌曲信息接口
 * 包含歌曲的各种信息，如ID、类型、名称、歌手、专辑等
 */
export interface SongInfo {
  id: number;
  type: number;
  mid: string;
  name: string;
  title: string;
  subtitle: string;
  singer: SingerSimpleInfo[];
  album: SongAlbumInfo;
  mv: SongMVInfo;
  interval: number;
  isonly: number;
  language: number;
  genre: number;
  index_cd: number;
  index_album: number;
  time_public: string;
  status: number;
  fnote: number;
  file: SongFileInfo;
  pay: SongPayInfo;
  action: SongActionInfo;
  ksong: KSongInfo;
  volume: SongVolumeInfo;
  label: string;
  url: string;
  bpm: number;
  version: number;
  trace: string;
  data_type: number;
  modify_stamp: number;
  pingpong: string;
  ppurl: string;
  tid: number;
  ov: number;
}

/**
 * 歌手详细信息接口
 * 包含歌手的区域、属性、流派、其他名称、ID、粉丝数等信息
 */
export interface SingerFullInfo {
  area: number;
  attribute4: number;
  genre: number;
  other_name: string;
  id: number;
  mid: string;
  name: string;
  fans: number;
}

/**
 * 歌曲额外信息接口
 * 包含歌曲的收听次数、上传时间等信息
 */
export interface SongExtraInfo {
  listen_count: number;
  upload_time: string;
  is_only: number;
  is_new: number;
}

/**
 * 歌手响应数据接口
 * 包含代码和歌手相关数据，如歌曲列表、歌手简介等
 */
export interface SingerResponseData {
  code: number;
  data: {
    songlist: SongInfo[];
    singer_info: SingerFullInfo;
    singer_brief: string;
    music_grp: [];
    total_album: number;
    total_mv: number;
    total_song: number;
    yinyueren: string;
    show_singer_desc: boolean;
    extras: SongExtraInfo[];
  };
}

/**
 * 总体响应数据接口
 * 包含响应的代码、时间戳、追踪ID和歌手信息
 */
export interface OverallSingerResponseData {
  code: number;
  ts: number;
  start_ts: number;
  traceid: string;
  singer: SingerResponseData;
}

/**
 * 专辑信息接口
 * 包含专辑的各种属性，如专辑中间ID、名称、发布日期等
 */
export interface AlbumInfo {
  albumMid: string;
  albumName: string;
  albumTranName: string;
  publishDate: string;
  totalNum: number;
  albumType: string;
  pmid: string;
  albumID: number;
  singerName: string;
  tags: null | string[];
}

/**
 * 歌手数据接口
 * 包含歌手的代码和相关数据，如歌手中间ID和专辑列表
 */
export interface SingerData {
  code: number;
  data: {
    singerMid: string;
    albumList: AlbumInfo[];
    total: number;
  };
}

/**
 * 响应数据接口
 * 包含响应的代码、时间戳、追踪ID和歌手信息
 */
export interface SingerAlbumResponseData {
  code: number;
  ts: number;
  start_ts: number;
  traceid: string;
  singer: SingerData;
}

export interface AlbumInfoResponseData {
  /** 响应码 */
  code: number;
  /** 响应数据 */
  data: {
    /** 日期 */
    aDate: string;
    /** 专辑提示信息 */
    albumTips: string;
    /** 颜色 */
    color: number;
    /** 公司名称 */
    company: string;
    /** 新公司信息 */
    company_new: {
      /** 公司简介 */
      brief: string;
      /** 公司头像链接 */
      headPic: string;
      /** 公司ID */
      id: number;
      /** 是否显示 */
      is_show: number;
      /** 公司名称 */
      name: string;
    };
    /** 当前歌曲数量 */
    cur_song_num: number;
    /** 歌曲描述 */
    desc: string;
    /** 音乐类型 */
    genre: string;
    /** 歌曲ID */
    id: number;
    /** 语言 */
    lan: string;
    /** 歌曲列表 */
    list: Array<{
      /** 专辑描述 */
      albumdesc: string;
      /** 专辑ID */
      albumid: number;
      /** 专辑中间ID */
      albummid: string;
      /** 专辑名称 */
      albumname: string;
      /** 提醒ID */
      alertid: number;
      /** 所属CD */
      belongCD: number;
      /** CD索引 */
      cdIdx: number;
      /** 间隔 */
      interval: number;
      /** 是否唯一 */
      isonly: number;
      /** 标签 */
      label: string;
      /** 消息ID */
      msgid: number;
      /** 付费信息 */
      pay: {
        /** 专辑付费状态 */
        payalbum: number;
        /** 专辑付费价格 */
        payalbumprice: number;
        /** 下载付费状态 */
        paydownload: number;
        /** 付费信息状态 */
        payinfo: number;
        /** 播放付费状态 */
        payplay: number;
        /** 音轨付费数量 */
        paytrackmouth: number;
        /** 音轨付费价格 */
        paytrackprice: number;
        /** 免费时长 */
        timefree: number;
      };
      /** 预览信息 */
      preview: {
        /** 预览开始位置 */
        trybegin: number;
        /** 预览结束位置 */
        tryend: number;
        /** 预览大小 */
        trysize: number;
      };
      /** 评分 */
      rate: number;
      /** 歌手列表 */
      singer: Array<{
        /** 歌手ID */
        id: number;
        /** 歌手中间ID */
        mid: string;
        /** 歌手名称 */
        name: string;
      }>;
      /** 128kbps歌曲大小 */
      size128: number;
      /** 320kbps歌曲大小 */
      size320: number;
      /** 5.1声道歌曲大小 */
      size5_1: number;
      /** ape格式歌曲大小 */
      sizeape: number;
      /** flac格式歌曲大小 */
      sizeflac: number;
      /** ogg格式歌曲大小 */
      sizeogg: number;
      /** 歌曲ID */
      songid: number;
      /** 歌曲中间ID */
      songmid: string;
      /** 歌曲名称 */
      songname: string;
      /** 歌曲原名 */
      songorig: string;
      /** 歌曲类型 */
      songtype: number;
      /** 媒体中间ID */
      strMediaMid: string;
      /** 流信息 */
      stream: number;
      /** 开关 */
      switch: number;
      /** 类型 */
      type: number;
      /** 视频ID */
      vid: string;
    }>;
    /** 中间ID */
    mid: string;
    /** 名称 */
    name: string;
    /** 电台主播 */
    radio_anchor: number;
    /** 歌手ID */
    singerid: number;
    /** 歌手微博 */
    singermblog: string;
    /** 歌手中间ID */
    singermid: string;
    /** 歌手名称 */
    singername: string;
    /** 歌曲开始位置 */
    song_begin: number;
    /** 总数 */
    total: number;
    /** 总歌曲数量 */
    total_song_num: number;
  };
  /** 消息 */
  message: string;
  /** 子代码 */
  subcode: number;
}
