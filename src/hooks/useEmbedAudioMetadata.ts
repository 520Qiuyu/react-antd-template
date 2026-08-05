import { FFmpeg, type LogEventCallback, type ProgressEventCallback } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const isProduction = import.meta.env.PROD;
// const FFMPEG_CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
const FFMPEG_CORE_BASE_URL = isProduction
  ? 'https://cdn.qiuyu520.fun'
  : 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

/** 模块级单例：多处 useEmbedAudioMetadata 必须共享同一 FFmpeg 实例与加载 promise */
let sharedFfmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
let sharedStatus: FFmpegStatus = 'idle';
let sharedError: Error | null = null;
let sharedProgress = 0;
/** 实例重建代数：hook 用其重新绑定 log/progress，避免挂在已 terminate 的旧实例上 */
let sharedGeneration = 0;
/** 缓存 core blob URL，OOM 重建时免重复下载 ~30MB wasm */
let cachedCoreURL: string | null = null;
let cachedWasmURL: string | null = null;

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
 * 判断是否为 ffmpeg.wasm 致命内存错误（堆越界/OOM）
 * @example
 * isFfmpegFatalMemoryError(new RuntimeError('memory access out of bounds')) // true
 */
const isFfmpegFatalMemoryError = (cause: unknown) => {
  const message = cause instanceof Error ? cause.message : String(cause ?? '');
  const name = cause instanceof Error ? cause.name : '';
  const text = `${name} ${message}`.toLowerCase();
  return (
    text.includes('memory access out of bounds') ||
    text.includes('out of memory') ||
    text.includes('cannot enlarge memory') ||
    text.includes('oom') ||
    name === 'RuntimeError'
  );
};

/**
 * 销毁当前共享 FFmpeg 实例并提升 generation，供后续重新 load
 * @example
 * await resetSharedFfmpeg();
 * await loadFfmpeg(); // 会拿到全新实例
 */
const resetSharedFfmpeg = async () => {
  const prev = sharedFfmpeg;
  sharedFfmpeg = null;
  loadPromise = null;
  sharedProgress = 0;
  sharedError = null;
  sharedGeneration += 1;
  sharedStatus = 'idle';
  notifySharedListeners();

  if (!prev) return;
  try {
    prev.terminate();
  } catch {
    /* terminate 在 worker 已挂时可能抛错，忽略 */
  }
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
  const [generation, setGeneration] = useState(sharedGeneration);

  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // 订阅模块级状态，保证 EngineStatus / 下载侧状态一致
  useEffect(() => {
    const sync = () => {
      setStatus(sharedStatus);
      setProgress(sharedProgress);
      setError(sharedError);
      setGeneration(sharedGeneration);
    };
    sync();
    sharedListeners.add(sync);
    return () => {
      sharedListeners.delete(sync);
    };
  }, []);

  // generation 变化时重新绑定到新实例（OOM 重建后旧 worker 已失效）
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
  }, [generation]);

  const loadFfmpeg = useCallback(async () => {
    const ffmpeg = getSharedFfmpeg();
    if (ffmpeg.loaded) {
      setSharedStatus('ready');
      return ffmpeg;
    }

    // 已有进行中的加载则直接复用，避免并发重复 load
    if (!loadPromise) {
      setSharedStatus('loading');
      setSharedProgress(0);
      // 同步赋值：把整段异步流程包进 IIFE，先占位再 await，
      // 否则 await 下载期间 loadPromise 仍为 null，并发调用会各自重新加载
      loadPromise = (async () => {
        if (!cachedCoreURL || !cachedWasmURL) {
          const downloadState = {
            jsReceived: 0,
            jsTotal: 0,
            wasmReceived: 0,
            wasmTotal: 0,
          };

          const reportLoadProgress = () => {
            const total = downloadState.jsTotal + downloadState.wasmTotal;
            if (total <= 0) return;
            const received = downloadState.jsReceived + downloadState.wasmReceived;
            // 下载占 0–90%，剩余留给 ffmpeg.load 初始化
            const downloadPercent = Math.round(Math.min(1, received / total) * 90);
            setSharedProgress(downloadPercent);
            callbacksRef.current.onProgress?.(downloadPercent);
          };

          const [coreURL, wasmURL] = await Promise.all([
            fetchToBlobURL(
              `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
              'text/javascript',
              ({ received, total }) => {
                downloadState.jsReceived = received;
                downloadState.jsTotal = total;
                reportLoadProgress();
              },
            ),
            fetchToBlobURL(
              `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
              'application/wasm',
              ({ received, total }) => {
                downloadState.wasmReceived = received;
                downloadState.wasmTotal = total;
                reportLoadProgress();
              },
            ),
          ]);
          cachedCoreURL = coreURL;
          cachedWasmURL = wasmURL;
        }

        setSharedProgress(95);
        callbacksRef.current.onProgress?.(95);
        await ffmpeg.load({ coreURL: cachedCoreURL!, wasmURL: cachedWasmURL! });
        setSharedProgress(100);
        callbacksRef.current.onProgress?.(100);
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
      const coverExt = cover ? normalizeCoverExt(rawCoverExt) : null;
      if (cover && !coverExt) {
        throw new Error('专辑封面文件名无效');
      }

      // 批量多首后 WASM 堆可能越界：捕获后重建实例并重试当前曲一次
      let allowMemoryRetry = true;

      while (true) {
        const sourceName = `input.${inputExt}`;
        const temporaryFiles = [sourceName];
        if (coverExt) temporaryFiles.push(`cover.${coverExt}`);

        const ffmpeg = getSharedFfmpeg();
        try {
          await loadFfmpeg();
          setSharedStatus('processing');
          await ffmpeg.writeFile(sourceName, await fetchFile(audio));

          if (cover && coverExt) {
            await ffmpeg.writeFile(`cover.${coverExt}`, await fetchFile(cover));
          }

          // 视频容器：有封面时先抽纯音轨再嵌封面（避免音画交织+封面同时处理卡住）；
          // 无封面且目标 m4a 时可一步完成（抽轨+元数据），少一轮 remux
          let audioInputName = sourceName;
          let audioInputExt = inputExt;
          const isVideoInput = isVideoContainerExt(inputExt);

          if (isVideoInput) {
            const canFinishInOnePass = !coverExt && outputFormat === 'm4a';
            const extractedName = canFinishInOnePass ? `output.${outputFormat}` : 'extracted.m4a';
            temporaryFiles.push(extractedName);

            const extractArgs = [
              '-y',
              '-i',
              sourceName,
              '-map',
              '0:a:0',
              '-vn',
              '-c:a',
              'copy',
              ...(canFinishInOnePass ? buildMetadataArgs(metadata) : []),
              extractedName,
            ];
            console.log('extractArgs', extractArgs);
            const extractCode = await ffmpeg.exec(extractArgs);
            if (extractCode !== 0) {
              throw new Error(`ffmpeg 抽取音轨失败，退出码：${extractCode}`);
            }

            await ffmpeg.deleteFile(sourceName).catch(() => undefined);
            const sourceIdx = temporaryFiles.indexOf(sourceName);
            if (sourceIdx >= 0) temporaryFiles.splice(sourceIdx, 1);

            if (canFinishInOnePass) {
              const outputData = await ffmpeg.readFile(extractedName);
              setSharedProgress(100);
              callbacksRef.current.onProgress?.(100);
              const outputBlob = createOutputBlob(outputData, OUTPUT_MIME[outputFormat]);
              setSharedStatus('ready');
              return outputBlob;
            }

            audioInputName = extractedName;
            audioInputExt = 'm4a';
          }

          const { args, outputName, mimeType } = buildFfmpegArgs(
            audioInputName,
            audioInputExt,
            coverExt,
            metadata,
            outputFormat,
          );
          temporaryFiles.push(outputName);
          console.log('args', args);

          const exitCode = await ffmpeg.exec(args);
          if (exitCode !== 0) {
            throw new Error(`ffmpeg 处理失败，退出码：${exitCode}`);
          }

          // 读输出前删掉输入，避免 wasm/JS 内存叠加卡住
          await cleanupFiles(
            ffmpeg,
            temporaryFiles.filter((name) => name !== outputName),
          );
          temporaryFiles.length = 0;
          temporaryFiles.push(outputName);

          const outputData = await ffmpeg.readFile(outputName);
          setSharedProgress(100);
          callbacksRef.current.onProgress?.(100);
          const outputBlob = createOutputBlob(outputData, mimeType);
          setSharedStatus('ready');
          return outputBlob;
        } catch (cause) {
          console.log('cause', cause);
          if (allowMemoryRetry && isFfmpegFatalMemoryError(cause)) {
            allowMemoryRetry = false;
            console.warn('FFmpeg WASM 内存异常，重建实例后重试当前歌曲');
            await resetSharedFfmpeg();
            continue;
          }
          const processingError = cause instanceof Error ? cause : new Error('音频元信息写入失败');
          setSharedStatus('error', processingError);
          throw processingError;
        } finally {
          await cleanupFiles(ffmpeg, temporaryFiles);
        }
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

/** 视为视频容器的扩展名：需先抽音轨再嵌元数据 */
const VIDEO_CONTAINER_EXTS = new Set(['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi']);

const isVideoContainerExt = (ext: string) => VIDEO_CONTAINER_EXTS.has(ext);

/** jpeg 系封面可直接 copy，避免 wasm 再编码卡住 */
const JPEG_COVER_EXTS = new Set(['jpg', 'jpeg', 'jpe', 'jfif', 'mjpeg']);

/**
 * 归一化封面扩展名
 * @example
 * normalizeCoverExt('JPEG') // 'jpeg'
 */
const normalizeCoverExt = (ext: string | null) => {
  if (!ext) return null;
  if (ext === 'jpg' || ext === 'jpe' || ext === 'jfif') return 'jpeg';
  return ext;
};

/** 按目标格式选择音频编码参数；同格式时可 copy，跨格式用高码率重编码 */
const buildAudioCodecArgs = (outputFormat: EmbedOutputFormat, inputExt: string) => {
  if (outputFormat === 'mp3') {
    return inputExt === 'mp3' ? ['-c:a', 'copy'] : ['-c:a', 'libmp3lame', '-b:a', '320k'];
  }
  if (outputFormat === 'm4a') {
    return ['m4a', 'aac'].includes(inputExt) ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '320k'];
  }
  return inputExt === 'flac' ? ['-c:a', 'copy'] : ['-c:a', 'flac'];
};

/** 按目标格式追加封面 / 标签容器相关参数 */
const buildContainerArgs = (outputFormat: EmbedOutputFormat, coverExt: string | null) => {
  const args: string[] = [];
  const hasCover = Boolean(coverExt);
  const coverVideoCodec = coverExt && JPEG_COVER_EXTS.has(coverExt) ? 'copy' : 'mjpeg';

  if (outputFormat === 'mp3') {
    args.push('-id3v2_version', '3', '-write_id3v2', '1');
    if (hasCover) {
      args.push(
        '-c:v',
        coverVideoCodec,
        '-frames:v',
        '1',
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
      args.push('-c:v', coverVideoCodec, '-frames:v', '1', '-disposition:v:0', 'attached_pic');
    }
    return args;
  }

  // flac
  if (hasCover) {
    args.push('-c:v', coverVideoCodec, '-frames:v', '1', '-disposition:v:0', 'attached_pic');
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
 * @example
 * ```ts
 * buildFfmpegArgs('extracted.m4a', 'm4a', 'jpeg', { title: '歌名' }, 'm4a');
 * ```
 */
const buildFfmpegArgs = (
  inputName: string,
  inputExt: string,
  coverExt: string | null,
  metadata: AudioMetadata,
  outputFormat: EmbedOutputFormat,
) => {
  const outputName = `output.${outputFormat}`;
  const hasCover = Boolean(coverExt);
  const args = ['-y', '-i', inputName];

  if (hasCover && coverExt) {
    args.push('-i', `cover.${coverExt}`, '-map', '0:a:0', '-map', '1:v:0');
  } else {
    args.push('-map', '0:a:0');
  }

  args.push(...buildAudioCodecArgs(outputFormat, inputExt));
  args.push(...buildContainerArgs(outputFormat, coverExt));
  args.push(...buildMetadataArgs(metadata));
  args.push(outputName);

  return { args, outputName, mimeType: OUTPUT_MIME[outputFormat], outputFormat };
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
 * 带下载进度的资源拉取，替代 `@ffmpeg/util` 的 `toBlobURL`
 *
 * @description
 * 通过 ReadableStream 累计已读字节。浏览器会自动解压 gzip/br 时，
 * `Content-Length` 是压缩体积而 `received` 是解压后体积，二者不可直接相除；
 * 此时用压缩比估算解压后体积作为进度分母，结束时以真实 `received` 校准。
 *
 * @example
 * ```ts
 * const url = await fetchToBlobURL(
 *   'https://cdn.example.com/ffmpeg-core.wasm',
 *   'application/wasm',
 *   ({ received, total }) => {
 *     if (total > 0) console.log(Math.round((received / total) * 100));
 *   },
 * );
 * ```
 */
const fetchToBlobURL = async (
  url: string,
  mimeType: string,
  onChunk?: (info: { received: number; total: number }) => void,
) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败（${response.status}）：${url}`);
  }
  if (!response.body) {
    throw new Error(`响应无 body：${url}`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  const encoding = (response.headers.get('content-encoding') || '').toLowerCase();
  const isCompressed =
    encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate');
  // 压缩传输时 Content-Length 偏小；经验解压比约 3.5（wasm 常见 3~4）
  const GZIP_RATIO_ESTIMATE = 3.5;
  let total =
    contentLength <= 0
      ? 0
      : isCompressed
        ? Math.round(contentLength * GZIP_RATIO_ESTIMATE)
        : contentLength;
  let treatedAsCompressed = isCompressed;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;

    // CORS 可能藏掉 Content-Encoding：一旦解压字节超过 Content-Length，按压缩传输处理
    if (!treatedAsCompressed && contentLength > 0 && received > contentLength) {
      treatedAsCompressed = true;
      total = Math.round(contentLength * GZIP_RATIO_ESTIMATE);
    }
    // 估算仍偏小则继续放大，避免进度提前顶满
    if (total > 0 && received > total) {
      total = Math.round(received / 0.9);
    }
    onChunk?.({ received, total });
  }

  // 下载结束用真实体积校准，保证该文件进度到 100%
  onChunk?.({ received, total: received });

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
};
