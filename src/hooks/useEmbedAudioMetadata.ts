import { FFmpeg, type LogEventCallback, type ProgressEventCallback } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

/** 模块级单例：多处 useEmbedAudioMetadata 必须共享同一 FFmpeg 实例与加载 promise */
let sharedFfmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
let sharedStatus: FFmpegStatus = 'idle';
let sharedError: Error | null = null;
let sharedProgress = 0;

type SharedListener = () => void;
const sharedListeners = new Set<SharedListener>();

const getSharedFfmpeg = () => {
  if (!sharedFfmpeg) sharedFfmpeg = new FFmpeg();
  return sharedFfmpeg;
};

const notifySharedListeners = () => {
  sharedListeners.forEach((listener) => listener());
};

const setSharedStatus = (status: FFmpegStatus, error: Error | null = null) => {
  sharedStatus = status;
  sharedError = error;
  notifySharedListeners();
};

const setSharedProgress = (progress: number) => {
  sharedProgress = progress;
  notifySharedListeners();
};

/**
 * 使用 ffmpeg-wasm 为音频 Blob 写入元信息 / 封面，并可选转为 mp3 | m4a | flac
 *
 * @example
 * const { embedMetadata } = useEmbedAudioMetadata();
 * const output = await embedMetadata({
 *   audio: musicBlob,
 *   audioName: 'song.m4a',
 *   cover: coverFile,
 *   coverName: 'cover.jpg',
 *   outputFormat: 'flac',
 *   metadata: { title: '歌名', artist: '歌手', album: '专辑' },
 * });
 */
export const useEmbedAudioMetadata = (options: UseEmbedAudioMetadataOptions = {}) => {
  const callbacksRef = useRef(options);
  const [status, setStatus] = useState<FFmpegStatus>(sharedStatus);
  const [progress, setProgress] = useState(sharedProgress);
  const [error, setError] = useState<Error | null>(sharedError);

  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // 订阅模块级状态，保证 EngineStatus / 下载侧状态一致
  useEffect(() => {
    const sync = () => {
      setStatus(sharedStatus);
      setProgress(sharedProgress);
      setError(sharedError);
    };
    sync();
    sharedListeners.add(sync);
    return () => {
      sharedListeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    const ffmpeg = getSharedFfmpeg();
    const handleLog: LogEventCallback = ({ message, type }) =>
      callbacksRef.current.onLog?.(message, type);
    const handleProgress: ProgressEventCallback = ({ progress: ratio }) => {
      const nextProgress = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
      setSharedProgress(nextProgress);
      callbacksRef.current.onProgress?.(nextProgress);
    };

    ffmpeg.on('log', handleLog);
    ffmpeg.on('progress', handleProgress);

    return () => {
      ffmpeg.off('log', handleLog);
      ffmpeg.off('progress', handleProgress);
    };
  }, []);

  const loadFfmpeg = useCallback(async () => {
    const ffmpeg = getSharedFfmpeg();
    if (ffmpeg.loaded) {
      setSharedStatus('ready');
      return ffmpeg;
    }

    // 已有进行中的加载则直接复用，避免并发重复 load
    if (!loadPromise) {
      setSharedStatus('loading');
      // 同步赋值：把整段异步流程包进 IIFE，先占位再 await，
      // 否则 await toBlobURL 期间 loadPromise 仍为 null，并发调用会各自重新加载
      loadPromise = (async () => {
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
        ]);
        await ffmpeg.load({ coreURL, wasmURL });
        return ffmpeg;
      })();
    }

    try {
      await loadPromise;
    } catch (loadError) {
      // 加载失败清空缓存，允许后续重试
      loadPromise = null;
      const nextError = loadError instanceof Error ? loadError : new Error('FFmpeg 加载失败');
      setSharedStatus('error', nextError);
      throw nextError;
    }

    setSharedStatus('ready');
    callbacksRef.current.onLoaded?.();
    return ffmpeg;
  }, []);

  useEffect(() => {
    loadFfmpeg().catch(() => {
      /* 错误已写入 sharedError，由 UI 展示 */
    });
  }, [loadFfmpeg]);

  const embedMetadata = useCallback(
    async ({
      audio,
      audioName,
      cover,
      coverName,
      metadata,
      outputFormat = 'mp3',
    }: EmbedAudioMetadataOptions) => {
      setSharedProgress(0);

      const inputExt = audioName.split('.').pop()?.toLowerCase();
      const rawCoverExt = coverName?.split('.').pop()?.toLowerCase()?.replace(/\?.*$/, '') || null;
      if (!inputExt) {
        throw new Error('音频文件名无效');
      }
      // 仅当 cover Blob 真实存在时才映射封面；避免只有 coverName 导致找不到 cover.jpg
      const coverExt = cover ? rawCoverExt : null;
      if (cover && !coverExt) {
        throw new Error('专辑封面文件名无效');
      }
      const { args, inputName, outputName, mimeType } = buildFfmpegArgs(
        inputExt,
        coverExt,
        metadata,
        outputFormat,
      );
      console.log('args', args);
      const temporaryFiles = [inputName, outputName];
      if (coverExt) temporaryFiles.push(`cover.${coverExt}`);

      const ffmpeg = getSharedFfmpeg();
      try {
        await loadFfmpeg();
        setSharedStatus('processing');
        await ffmpeg.writeFile(inputName, await fetchFile(audio));

        if (cover && coverExt) {
          await ffmpeg.writeFile(`cover.${coverExt}`, await fetchFile(cover));
        }

        const exitCode = await ffmpeg.exec(args);
        if (exitCode !== 0) {
          throw new Error(`ffmpeg 处理失败，退出码：${exitCode}`);
        }

        const outputData = await ffmpeg.readFile(outputName);
        setSharedProgress(100);
        callbacksRef.current.onProgress?.(100);
        const outputBlob = createOutputBlob(outputData, mimeType);
        setSharedStatus('ready');
        return outputBlob;
      } catch (cause) {
        console.log('cause', cause);
        const processingError = cause instanceof Error ? cause : new Error('音频元信息写入失败');
        setSharedStatus('error', processingError);
        throw processingError;
      } finally {
        await cleanupFiles(ffmpeg, temporaryFiles);
      }
    },
    [loadFfmpeg],
  );

  const coreLoading = status === 'loading';
  const processing = status === 'processing';
  const loaded = status === 'ready' || processing;

  return {
    coreLoading,
    processing,
    loading: coreLoading || processing,
    loaded,
    loadStage:
      error?.message ||
      {
        idle: '未加载',
        loading: '正在下载并初始化 FFmpeg Core...',
        ready: '已就绪',
        processing: '正在写入音频元信息...',
        error: '加载失败',
      }[status],
    status,
    error,
    progress,
    loadFfmpeg,
    embedMetadata,
  };
};

export type FFmpegStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

/** 支持写入元信息后的输出容器格式 */
export type EmbedOutputFormat = 'mp3' | 'm4a' | 'flac';

/** 音频元信息字段 */
export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: string;
  lyrics?: string;
  comment?: string;
}

export interface EmbedAudioMetadataOptions {
  /** 音频文件或 Blob */
  audio: Blob | File;
  /** 音频文件名 */
  audioName: string;
  /** 专辑封面图片（可选） */
  cover?: Blob | File | null;
  /** 专辑封面文件名 */
  coverName?: string;
  /** 元信息 */
  metadata: AudioMetadata;
  /** 输出格式，默认 mp3 */
  outputFormat?: EmbedOutputFormat;
}

export interface UseEmbedAudioMetadataOptions {
  /** FFmpeg 核心加载完成 */
  onLoaded?: () => void;
  /** 处理进度 0-100 */
  onProgress?: (progress: number) => void;
  /** ffmpeg 日志输出，便于调试加载失败原因 */
  onLog?: (message: string, type: string) => void;
}
const OUTPUT_MIME: Record<EmbedOutputFormat, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
};

/** 按目标格式选择音频编码参数；同格式时可 copy */
const buildAudioCodecArgs = (outputFormat: EmbedOutputFormat, inputExt: string) => {
  if (outputFormat === 'mp3') {
    return inputExt === 'mp3' ? ['-c:a', 'copy'] : ['-c:a', 'libmp3lame', '-q:a', '2'];
  }
  if (outputFormat === 'm4a') {
    return ['m4a', 'mp4', 'aac'].includes(inputExt)
      ? ['-c:a', 'copy']
      : ['-c:a', 'aac', '-b:a', '256k'];
  }
  return inputExt === 'flac' ? ['-c:a', 'copy'] : ['-c:a', 'flac'];
};

/** 按目标格式追加封面 / 标签容器相关参数 */
const buildContainerArgs = (outputFormat: EmbedOutputFormat, hasCover: boolean) => {
  const args: string[] = [];

  if (outputFormat === 'mp3') {
    args.push('-id3v2_version', '3', '-write_id3v2', '1');
    if (hasCover) {
      args.push(
        '-c:v',
        'mjpeg',
        '-metadata:s:v',
        'title=Album cover',
        '-metadata:s:v',
        'comment=Cover (front)',
      );
    }
    return args;
  }

  if (outputFormat === 'm4a') {
    if (hasCover) {
      args.push('-c:v', 'mjpeg', '-disposition:v:0', 'attached_pic');
    }
    return args;
  }

  // flac
  if (hasCover) {
    args.push('-c:v', 'mjpeg', '-disposition:v:0', 'attached_pic');
  }
  return args;
};

/** 将元信息对象转为 ffmpeg -metadata 参数 */
const buildMetadataArgs = (metadata: AudioMetadata) => {
  const args: string[] = [];
  const fieldMap: [keyof AudioMetadata, string][] = [
    ['title', 'title'],
    ['artist', 'artist'],
    ['album', 'album'],
    ['albumArtist', 'album_artist'],
    ['genre', 'genre'],
    ['year', 'date'],
    ['lyrics', 'lyrics'],
    ['comment', 'comment'],
  ];

  fieldMap.forEach(([key, ffmpegKey]) => {
    const value = metadata[key]?.trim();
    if (value) {
      if (ffmpegKey === 'lyrics') {
        args.push('-metadata', `${ffmpegKey}=${value}`, '-metadata', `UNSYNCED LYRICS=${value}`);
      } else {
        args.push('-metadata', `${ffmpegKey}=${value}`);
      }
    }
  });

  return args;
};

/**
 * 按目标格式（mp3 / m4a / flac）构建 ffmpeg 参数，写入元信息与可选封面
 */
const buildFfmpegArgs = (
  inputExt: string,
  coverExt: string | null,
  metadata: AudioMetadata,
  outputFormat: EmbedOutputFormat,
) => {
  const inputName = `input.${inputExt}`;
  const outputName = `output.${outputFormat}`;
  const hasCover = Boolean(coverExt);
  const args = ['-i', inputName];

  if (hasCover && coverExt) {
    args.push('-i', `cover.${coverExt}`, '-map', '0:a:0', '-map', '1:v:0');
  } else {
    args.push('-map', '0:a:0');
  }

  args.push(...buildAudioCodecArgs(outputFormat, inputExt));
  args.push(...buildContainerArgs(outputFormat, hasCover));
  args.push(...buildMetadataArgs(metadata));
  args.push(outputName);

  return { args, inputName, outputName, mimeType: OUTPUT_MIME[outputFormat], outputFormat };
};

/** 将 FFmpeg 文件系统返回值转换为可下载 Blob。 */
const createOutputBlob = (data: Awaited<ReturnType<FFmpeg['readFile']>>, mimeType: string) => {
  if (typeof data === 'string') {
    throw new Error('FFmpeg 返回了非二进制音频数据');
  }
  return new Blob([Uint8Array.from(data)], { type: mimeType });
};

/** 安全清理 FFmpeg 虚拟文件系统中的临时文件。 */
const cleanupFiles = async (ffmpeg: FFmpeg, fileNames: string[]) => {
  await Promise.allSettled(fileNames.map((fileName) => ffmpeg.deleteFile(fileName)));
};
