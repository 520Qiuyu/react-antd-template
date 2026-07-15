import { FFmpeg, type LogEventCallback, type ProgressEventCallback } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'flac', 'ogg', 'wav'] as const;
const COVER_EXTENSIONS = ['jpg', 'png'] as const;

export type FFmpegStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

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
  /** 专辑封面图片（可选） */
  cover?: Blob | File | null;
  /** 元信息 */
  metadata: AudioMetadata;
}

export interface UseEmbedAudioMetadataOptions {
  /** FFmpeg 核心加载完成 */
  onLoaded?: () => void;
  /** 处理进度 0-100 */
  onProgress?: (progress: number) => void;
  /** ffmpeg 日志输出，便于调试加载失败原因 */
  onLog?: (message: string,type: 'log' | 'progress') => void;
}

const AUDIO_EXT_MAP: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

const IMAGE_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SUPPORTED_AUDIO_EXTENSIONS = new Set<string>(AUDIO_EXTENSIONS);

/**
 * 从文件或 Blob 推断音频扩展名
 * @example getAudioExtension(new File([], 'song.m4a')) // 'm4a'
 */
const getAudioExtension = (audio: Blob | File) => {
  if (audio instanceof File) {
    const ext = audio.name.split('.').pop()?.toLowerCase();
    if (ext && SUPPORTED_AUDIO_EXTENSIONS.has(ext)) return ext;
  }
  return AUDIO_EXT_MAP[audio.type] || 'mp3';
};

/**
 * 从图片文件或 Blob 推断扩展名
 * @example getImageExtension(coverFile) // 'jpg'
 */
const getImageExtension = (image: Blob | File) => {
  if (image instanceof File) {
    const ext = image.name.split('.').pop()?.toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    if (ext && COVER_EXTENSIONS.includes(ext as (typeof COVER_EXTENSIONS)[number])) return ext;
  }
  return IMAGE_EXT_MAP[image.type] || 'jpg';
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
 * 根据音频格式与是否包含封面，构建 ffmpeg 写入元信息参数
 */
const buildFfmpegArgs = (inputExt: string, coverExt: string | null, metadata: AudioMetadata) => {
  const inputName = `input.${inputExt}`;
  const outputName = `output.${inputExt}`;
  const hasCover = Boolean(coverExt);
  const args = ['-i', inputName];

  if (hasCover && coverExt) {
    args.push('-i', `cover.${coverExt}`, '-map', '0:a:0', '-map', '1:v:0', '-c', 'copy');
  } else {
    args.push('-map', '0', '-c', 'copy');
  }

  if (inputExt === 'mp3') {
    args.push('-id3v2_version', '3');
    args.push('-write_id3v2', '1');
    if (hasCover) {
      args.push('-metadata:s:v', 'title=Album cover');
      args.push('-metadata:s:v', 'comment=Cover (front)');
    }
  } else if (['m4a', 'mp4', 'aac'].includes(inputExt) && hasCover) {
    args.push('-disposition:v:0', 'attached_pic');
  }

  args.push(...buildMetadataArgs(metadata));
  args.push(outputName);
  return { args, outputName };
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

/**
 * 使用 ffmpeg-wasm 为音频 Blob 写入 ID3 / 容器元信息，并可选嵌入专辑封面
 *
 * @example
 * const { embedMetadata, coreLoading } = useEmbedAudioMetadata();
 * const output = await embedMetadata({
 *   audio: musicBlob,
 *   cover: coverFile,
 *   metadata: { title: '歌名', artist: '歌手', album: '专辑' },
 * });
 */
export const useEmbedAudioMetadata = (options: UseEmbedAudioMetadataOptions = {}) => {
  const callbacksRef = useRef(options);
  const ffmpegRef = useRef(new FFmpeg());
  const loadPromiseRef = useRef<Promise<any>>(null);
  const [status, setStatus] = useState<FFmpegStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  useEffect(() => {
    const ffmpeg = ffmpegRef.current;
    const handleLog: LogEventCallback = ({ message,type }) => callbacksRef.current.onLog?.(message,type);
    const handleProgress: ProgressEventCallback = ({ progress: ratio }) => {
      const nextProgress = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
      setProgress(nextProgress);
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
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg.loaded) {
      setStatus('ready');
      return ffmpeg;
    }

    if (loadPromiseRef.current) return loadPromiseRef.current;

    setError(null);
    setStatus('loading');
    loadPromiseRef.current = ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(
        `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.worker.js`,
        'text/javascript',
      ),
    });
    await loadPromiseRef.current;
    setStatus('ready');
    callbacksRef.current.onLoaded?.();
    return ffmpeg;
  }, []);

  const embedMetadata = useCallback(
    async ({ audio, cover, metadata }: EmbedAudioMetadataOptions) => {
      setProgress(0);

      const inputExt = getAudioExtension(audio);
      const coverExt = cover ? getImageExtension(cover) : null;
      const inputName = `input.${inputExt}`;
      const { args, outputName } = buildFfmpegArgs(inputExt, coverExt, metadata);
      const temporaryFiles = [inputName, outputName];
      if (coverExt) temporaryFiles.push(`cover.${coverExt}`);

      try {
        const ffmpeg = await loadFfmpeg();
        setStatus('processing');
        await ffmpeg.writeFile(inputName, await fetchFile(audio));

        if (cover && coverExt) {
          await ffmpeg.writeFile(`cover.${coverExt}`, await fetchFile(cover));
        }

        const exitCode = await ffmpeg.exec(args);
        if (exitCode !== 0) {
          throw new Error(`ffmpeg 处理失败，退出码：${exitCode}`);
        }

        const outputData = await ffmpeg.readFile(outputName);
        const mimeType = audio.type || `audio/${inputExt === 'mp3' ? 'mpeg' : inputExt}`;
        setProgress(100);
        callbacksRef.current.onProgress?.(100);
        const outputBlob = createOutputBlob(outputData, mimeType);
        setStatus('ready');
        return outputBlob;
      } catch (cause) {
        const processingError = cause instanceof Error ? cause : new Error('音频元信息写入失败');
        setError(processingError);
        setStatus('error');
        throw processingError;
      } finally {
        await cleanupFiles(ffmpegRef.current, temporaryFiles);
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
