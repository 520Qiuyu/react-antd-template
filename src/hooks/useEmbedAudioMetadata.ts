import { FFmpeg, type LogEventCallback, type ProgressEventCallback } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import CoreJsUrl from '@ffmpeg/core?url';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getObjectFromSearch } from './useSearchParams';

const isProduction = import.meta.env.PROD;
// 默认
const FFMPEG_CORE_BASE_URL = isProduction
  ? // ? 'https://cdn.qiuyu520.fun' // 七牛云cdn
    'https://alicdn.qiuyu520.fun/npm/@ffmpeg/core@0.12.10/dist/esm' // 阿里云cdn
  : 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm'; // jsdelivr

const CDN_MAP = {
  ali: 'https://alicdn.qiuyu520.fun/npm/@ffmpeg/core@0.12.10/dist/esm',
  qiniu: 'https://cdn.qiuyu520.fun',
  jsdelivr: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm',
};
// 自定义url
const searchParams = getObjectFromSearch(window.location.hash) as { cdnType: keyof typeof CDN_MAP };
const cdnType = searchParams?.cdnType as keyof typeof CDN_MAP;
console.log('cdnType', cdnType);
const cdnUrl = cdnType ? CDN_MAP[cdnType as keyof typeof CDN_MAP] : FFMPEG_CORE_BASE_URL;
console.log('cdnUrl', cdnUrl);

/** 仅共享 core / wasm blob URL，避免每次内嵌重复下载 ~30MB */
let cachedCoreURL: string | null = null;
let cachedWasmURL: string | null = null;
/** 首次拉取 core 资源的 promise，并发调用共用同一次下载 */
let coreAssetsPromise: Promise<{ coreURL: string; wasmURL: string }> | null = null;

/** 模块级只存 WASM 资源加载状态（与内嵌无关） */
let sharedStatus: FFmpegStatus = 'idle';
let sharedError: Error | null = null;
let sharedProgress = 0;

type SharedListener = () => void;
const sharedListeners = new Set<SharedListener>();

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
 * 安全销毁 FFmpeg Worker，释放 WASM 堆
 * @example
 * safeTerminate(ffmpeg);
 */
const safeTerminate = (ffmpeg: FFmpeg) => {
  try {
    ffmpeg.terminate();
  } catch (error) {
    console.log('error', error);
  }
};

/**
 * 确保 core / wasm 已缓存到 blob URL（只下载一次）
 * @example
 * const { coreURL, wasmURL } = await ensureCoreAssets((p) => console.log(p));
 */
const ensureCoreAssets = async (onProgress?: (percent: number) => void) => {
  if (cachedCoreURL && cachedWasmURL) {
    return { coreURL: cachedCoreURL, wasmURL: cachedWasmURL };
  }

  if (!coreAssetsPromise) {
    setSharedStatus('loading');
    setSharedProgress(0);
    coreAssetsPromise = (async () => {
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
        // 下载占 0–90%，剩余留给单次 ffmpeg.load 初始化
        const downloadPercent = Math.round(Math.min(1, received / total) * 90);
        setSharedProgress(downloadPercent);
        onProgress?.(downloadPercent);
      };

      const [coreURL, wasmURL] = await Promise.all([
        fetchToBlobURL(CoreJsUrl, 'text/javascript', ({ received, total }) => {
          downloadState.jsReceived = received;
          downloadState.jsTotal = total;
          reportLoadProgress();
        }),
        fetchToBlobURL(
          `${cdnUrl || FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
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
      setSharedStatus('ready');
      setSharedProgress(100);
      return { coreURL, wasmURL };
    })().catch((loadError) => {
      coreAssetsPromise = null;
      throw loadError;
    });
  }

  return coreAssetsPromise;
};

/**
 * 新建 FFmpeg 实例并用缓存的 core URL 完成 load
 * @example
 * const ffmpeg = await createLoadedFfmpeg({ onLog, onProgress });
 */
const createLoadedFfmpeg = async (handlers: {
  onLog?: LogEventCallback;
  onProgress?: ProgressEventCallback;
}) => {
  const ffmpeg = new FFmpeg();
  if (handlers.onLog) ffmpeg.on('log', handlers.onLog);
  if (handlers.onProgress) ffmpeg.on('progress', handlers.onProgress);

  // 仅首次下载 core 时写入 shared；实例 load 本身不污染 WASM 加载态
  const { coreURL, wasmURL } = await ensureCoreAssets();
  await ffmpeg.load({ coreURL, wasmURL });
  return ffmpeg;
};

/**
 * 使用 ffmpeg-wasm 为音频 Blob 写入元信息 / 封面，并可选转为 mp3 | m4a | flac
 *
 * @description
 * 仅共享 core/wasm 下载缓存；每次内嵌新建独立 FFmpeg 实例，结束（含失败）后 terminate，
 * 避免并发抢 VFS 固定文件名，也避免单例堆膨胀。
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

  /**
   * 预加载 / 重试：只确保 core 资源就绪（不常驻 FFmpeg 实例）
   * @example
   * await loadFfmpeg();
   */
  const loadFfmpeg = useCallback(async () => {
    try {
      await ensureCoreAssets((percent) => {
        setSharedProgress(percent);
        callbacksRef.current.onProgress?.(percent);
      });
      setSharedStatus('ready');
      setSharedProgress(100);
      callbacksRef.current.onProgress?.(100);
      callbacksRef.current.onLoaded?.();
    } catch (loadError) {
      const nextError = loadError instanceof Error ? loadError : new Error('FFmpeg 加载失败');
      setSharedStatus('error', nextError);
      throw nextError;
    }
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
      sourceCodec,
      sourceBitrate,
      onProgress,
    }: EmbedAudioMetadataOptions) => {
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

      const sourceHead = new Uint8Array(await audio.slice(0, 256 * 1024).arrayBuffer());
      const copyExtractExt = resolveCopyExtractExt(sourceCodec, sourceHead);

      const reportEmbedProgress = (percent: number) => {
        const next = Math.round(Math.min(100, Math.max(0, percent)));
        onProgress?.(next);
        callbacksRef.current.onProgress?.(next);
      };

      // OOM 时换新实例再试一次（每次循环本就会 new）
      let allowMemoryRetry = true;

      while (true) {
        const sourceName = `input.${inputExt}`;
        const temporaryFiles = [sourceName];
        if (coverExt) temporaryFiles.push(`cover.${coverExt}`);

        let ffmpeg: FFmpeg | null = null;
        const probeLogs: string[] = [];
        reportEmbedProgress(0);

        try {
          const handleLog: LogEventCallback = ({ message, type }) => {
            probeLogs.push(message);
            callbacksRef.current.onLog?.(message, type);
          };
          const handleProgress: ProgressEventCallback = ({ progress: ratio }) => {
            reportEmbedProgress(Math.round(Math.min(1, Math.max(0, ratio)) * 100));
          };

          ffmpeg = await createLoadedFfmpeg({
            onLog: handleLog,
            onProgress: handleProgress,
          });

          await ffmpeg.writeFile(sourceName, await fetchFile(audio));

          if (cover && coverExt) {
            await ffmpeg.writeFile(`cover.${coverExt}`, await fetchFile(cover));
          }

          console.time(audioName);
          await ffmpeg.exec(['-hide_banner', '-i', sourceName]);
          const bitrateKbps =
            parseAudioBitrateKbps(probeLogs.join('\n')) ?? toBitrateKbps(sourceBitrate);
          console.timeEnd(audioName);

          // 视频/MP4 容器：先按音轨 codec 抽到可 copy 的容器（AAC→m4a，FLAC→flac）
          let audioInputName = sourceName;
          let audioInputExt = inputExt;
          const isVideoInput = isVideoContainerExt(inputExt);

          if (isVideoInput) {
            const canCopyToOutput = outputFormat === copyExtractExt;
            const canFinishInOnePass = !coverExt && canCopyToOutput;
            const extractedName = canFinishInOnePass
              ? `output.${outputFormat}`
              : `extracted.${copyExtractExt}`;
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
              reportEmbedProgress(100);
              return createOutputBlob(outputData, OUTPUT_MIME[outputFormat]);
            }

            audioInputName = extractedName;
            audioInputExt = copyExtractExt;
          }

          const { args, outputName, mimeType } = buildFfmpegArgs(
            audioInputName,
            audioInputExt,
            coverExt,
            metadata,
            outputFormat,
            bitrateKbps,
          );
          temporaryFiles.push(outputName);
          console.log('args', args);

          const exitCode = await ffmpeg.exec(args);
          if (exitCode !== 0) {
            throw new Error(`ffmpeg 处理失败，退出码：${exitCode}`);
          }

          await cleanupFiles(
            ffmpeg,
            temporaryFiles.filter((name) => name !== outputName),
          );
          temporaryFiles.length = 0;
          temporaryFiles.push(outputName);

          const outputData = await ffmpeg.readFile(outputName);
          reportEmbedProgress(100);
          return createOutputBlob(outputData, mimeType);
        } catch (cause) {
          console.log('cause', cause);
          if (allowMemoryRetry && isFfmpegFatalMemoryError(cause)) {
            allowMemoryRetry = false;
            console.warn('FFmpeg WASM 内存异常，换新实例后重试当前歌曲');
            continue;
          }
          const processingError = cause instanceof Error ? cause : new Error('音频元信息写入失败');
          throw processingError;
        } finally {
          if (ffmpeg) {
            await cleanupFiles(ffmpeg, temporaryFiles);
            safeTerminate(ffmpeg);
          }
        }
      }
    },
    [],
  );

  const coreLoading = status === 'loading';
  const loaded = status === 'ready';

  return {
    coreLoading,
    loading: coreLoading,
    loaded,
    loadStage:
      error?.message ||
      {
        idle: '未加载',
        loading: '正在下载并初始化 FFmpeg Core...',
        ready: '已就绪',
        error: '加载失败',
      }[status],
    status,
    error,
    /** WASM 资源下载进度（0–100）；内嵌进度请听 onProgress */
    progress,
    loadFfmpeg,
    embedMetadata,
  };
};

export type FFmpegStatus = 'idle' | 'loading' | 'ready' | 'error';

/** 支持写入元信息后的输出容器格式 */
export type EmbedOutputFormat = 'mp3' | 'm4a' | 'flac';

/** 后端返回的音轨 codec，如 aac / flac */
export type EmbedSourceCodec = string;

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
  /**
   * 后端返回的音轨 codec（如 aac / flac）。FLAC-in-MP4 不能 copy 进 m4a。
   */
  sourceCodec?: EmbedSourceCodec;
  /** 源文件码率（bps），探测失败时作为重编码码率 */
  sourceBitrate?: number;
  /** 本次内嵌进度 0–100（ffmpeg.exec 过程） */
  onProgress?: (progress: number) => void;
}

export interface UseEmbedAudioMetadataOptions {
  /** FFmpeg 核心加载完成 */
  onLoaded?: () => void;
  /** 进度 0-100：WASM 下载与内嵌过程都会回调（内嵌进度不入库） */
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

const FLAC_FOURCC = new TextEncoder().encode('fLaC');

/**
 * 在 MP4 头部查找 fLaC sample entry（lossless 为 FLAC-in-MP4）。
 * @example
 * sniffFlacInMp4(new Uint8Array([0x66, 0x4c, 0x61, 0x43])) // true
 */
const sniffFlacInMp4 = (bytes: Uint8Array) => {
  const limit = Math.min(bytes.length, 256 * 1024) - 3;
  for (let index = 0; index < limit; index += 1) {
    if (
      bytes[index] === FLAC_FOURCC[0] &&
      bytes[index + 1] === FLAC_FOURCC[1] &&
      bytes[index + 2] === FLAC_FOURCC[2] &&
      bytes[index + 3] === FLAC_FOURCC[3]
    ) {
      return true;
    }
  }
  return false;
};

/**
 * 视频/MP4 抽轨 copy 的目标扩展名：FLAC 只能进 .flac，AAC 进 .m4a。
 * @example
 * resolveCopyExtractExt('flac', new Uint8Array()) // 'flac'
 * resolveCopyExtractExt('aac', new Uint8Array()) // 'm4a'
 */
const resolveCopyExtractExt = (
  sourceCodec: EmbedSourceCodec | undefined,
  headBytes: Uint8Array,
): 'flac' | 'm4a' => {
  const normalized = sourceCodec?.trim().toLowerCase();
  if (normalized?.includes('flac')) return 'flac';
  if (normalized) return 'm4a';
  return sniffFlacInMp4(headBytes) ? 'flac' : 'm4a';
};

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

/**
 * 从 ffmpeg -i 日志里解析音轨码率（kb/s）
 * @example
 * parseAudioBitrateKbps('Stream #0:0: Audio: mp3, 44100 Hz, stereo, 128 kb/s') // 128
 */
const parseAudioBitrateKbps = (logText: string) => {
  const audioMatch = logText.match(/Audio:.*?\b(\d+)\s*kb\/s/i);
  if (audioMatch) return Number(audioMatch[1]);
  const durationMatch = logText.match(/bitrate:\s*(\d+)\s*kb\/s/i);
  if (durationMatch) return Number(durationMatch[1]);
  return 320;
};

/**
 * 将 bps 转为 kbps
 * @example
 * toBitrateKbps(128000) // 128
 */
const toBitrateKbps = (bps?: number) => {
  if (!bps || bps <= 0) return null;
  return Math.max(1, Math.round(bps / 1000));
};

/** 按目标格式选择音频编码参数；同格式 copy，跨格式沿用源码率且不超过 320k */
const buildAudioCodecArgs = (
  outputFormat: EmbedOutputFormat,
  inputExt: string,
  bitrateKbps: number = 320,
) => {
  const cappedKbps = Math.min(Math.max(1, bitrateKbps || 320), 320);
  const bitrateArgs = ['-b:a', `${cappedKbps}k`];
  if (outputFormat === 'mp3') {
    return inputExt === 'mp3' ? ['-c:a', 'copy'] : ['-c:a', 'libmp3lame', ...bitrateArgs];
  }
  if (outputFormat === 'm4a') {
    return ['m4a', 'aac'].includes(inputExt) ? ['-c:a', 'copy'] : ['-c:a', 'aac', ...bitrateArgs];
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
  bitrateKbps: number = 320,
) => {
  const outputName = `output.${outputFormat}`;
  const hasCover = Boolean(coverExt);
  const args = ['-y', '-i', inputName];

  if (hasCover && coverExt) {
    args.push('-i', `cover.${coverExt}`, '-map', '0:a:0', '-map', '1:v:0');
  } else {
    args.push('-map', '0:a:0');
  }

  args.push(...buildAudioCodecArgs(outputFormat, inputExt, bitrateKbps));
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
