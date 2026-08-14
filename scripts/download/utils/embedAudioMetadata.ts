/**
 * Node 版音频元信息 / 封面 / 歌词内嵌工具（逻辑对齐 src/hooks/useEmbedAudioMetadata.ts）。
 * 使用系统侧 ffmpeg-static，而非浏览器 ffmpeg.wasm。
 *
 * @example
 * import { embedMetadata } from './embedAudioMetadata.ts';
 * const { buffer } = await embedMetadata({
 *   audio: audioBuffer,
 *   audioName: 'song.m4a',
 *   cover: coverBuffer,
 *   coverName: 'cover.jpg',
 *   outputFormat: 'mp3',
 *   metadata: { title: '歌名', artist: '歌手', album: '专辑', lyrics: lrc },
 * });
 * await writeFile('out.mp3', buffer);
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/** 音频 / 封面输入：内存 Buffer 或本地路径 */
export type MediaInput = Buffer | Uint8Array | string;

export interface EmbedAudioMetadataOptions {
  /** 音频 Buffer 或本地路径 */
  audio: MediaInput;
  /** 音频文件名（用于推断扩展名，如 song.m4a） */
  audioName: string;
  /** 专辑封面 Buffer / 路径（可选） */
  cover?: MediaInput | null;
  /** 专辑封面文件名 */
  coverName?: string;
  /** 元信息 */
  metadata: AudioMetadata;
  /** 输出格式，默认 mp3 */
  outputFormat?: EmbedOutputFormat;
  /** 若传入则同时写入该路径 */
  outputPath?: string;
  /** ffmpeg stderr 日志 */
  onLog?: (message: string) => void;
}

export interface EmbedAudioMetadataResult {
  buffer: Buffer;
  outputFormat: EmbedOutputFormat;
  outputPath?: string;
}

const OUTPUT_MIME: Record<EmbedOutputFormat, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
};

/** 视为视频容器的扩展名：需先抽音轨再嵌元数据 */
const VIDEO_CONTAINER_EXTS = new Set(['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi']);

const isVideoContainerExt = (ext: string) => VIDEO_CONTAINER_EXTS.has(ext);

/** jpeg 系封面可直接 copy，避免再编码 */
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

const FFMPEG_EXE = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

/**
 * 解析 ffmpeg 路径：FFMPEG_PATH → node_modules/ffmpeg-static → PATH 上的 ffmpeg。
 * 不 import ffmpeg-static，避免 Perry 把其 CommonJS 当 JS runtime 拉进来。
 *
 * @example
 * resolveFfmpegPath() // '.../node_modules/ffmpeg-static/ffmpeg.exe' 或 'ffmpeg'
 */
const resolveFfmpegPath = () => {
  const fromEnv = process.env.FFMPEG_PATH?.trim();
  if (fromEnv) return fromEnv;

  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(dir, 'node_modules', 'ffmpeg-static', FFMPEG_EXE);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return 'ffmpeg';
};

/**
 * 将输入落成临时文件路径（Buffer 写入 disk，string 直接返回）。
 *
 * @example
 * const path = await materializeInput(buf, workDir, 'input.m4a');
 */
const materializeInput = async (
  input: MediaInput,
  workDir: string,
  fileName: string,
): Promise<string> => {
  if (typeof input === 'string') return input;
  const filePath = join(workDir, fileName);
  await writeFile(filePath, input instanceof Uint8Array ? input : Buffer.from(input));
  return filePath;
};

/**
 * 以参数数组调用 ffmpeg（不经 shell，便于传歌词换行）。
 *
 * @example
 * await runFfmpeg(['-y', '-i', 'in.m4a', 'out.mp3'], onLog);
 */
const runFfmpeg = (args: string[], onLog?: (message: string) => void) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(resolveFfmpegPath(), args, { windowsHide: true });
    let stderr = '';

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      text
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => onLog?.(line));
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg 处理失败，退出码：${code}\n${stderr.slice(-2000)}`));
    });
  });

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
  const hasCover = Boolean(coverExt) && false;
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
    if (!value) return;
    if (ffmpegKey === 'lyrics') {
      args.push('-metadata', `${ffmpegKey}=${value}`, '-metadata', `UNSYNCED LYRICS=${value}`);
      return;
    }
    args.push('-metadata', `${ffmpegKey}=${value}`);
  });

  return args;
};

/**
 * 按目标格式构建 ffmpeg 参数，写入元信息与可选封面。
 *
 * @example
 * buildFfmpegArgs('/tmp/a.m4a', 'm4a', '/tmp/cover.jpeg', 'jpeg', { title: '歌名' }, 'mp3', '/tmp/out.mp3');
 */
const buildFfmpegArgs = (
  inputPath: string,
  inputExt: string,
  coverPath: string | null,
  coverExt: string | null,
  metadata: AudioMetadata,
  outputFormat: EmbedOutputFormat,
  outputPath: string,
) => {
  const args = ['-y', '-i', inputPath];

  if (coverPath && coverExt) {
    args.push('-i', coverPath, '-map', '0:a:0', '-map', '1:v:0');
  } else {
    args.push('-map', '0:a:0');
  }

  args.push(...buildAudioCodecArgs(outputFormat, inputExt));
  args.push(...buildContainerArgs(outputFormat, coverExt));
  args.push(...buildMetadataArgs(metadata));
  args.push(outputPath);

  return args;
};

/**
 * 为音频写入元信息 / 封面 / 歌词，并可选转为 mp3 | m4a | flac。
 *
 * @example
 * const { buffer } = await embedMetadata({
 *   audio: decryptedBuffer,
 *   audioName: 'song.m4a',
 *   cover: coverBuffer,
 *   coverName: 'cover.jpg',
 *   metadata: { title: '歌名', artist: '歌手', lyrics: lrc },
 *   outputFormat: 'mp3',
 * });
 */
export const embedMetadata = async ({
  audio,
  audioName,
  cover,
  coverName,
  metadata,
  outputFormat = 'mp3',
  outputPath,
  onLog,
}: EmbedAudioMetadataOptions): Promise<EmbedAudioMetadataResult> => {
  const inputExt = audioName.split('.').pop()?.toLowerCase()?.replace(/\?.*$/, '');
  const rawCoverExt = coverName?.split('.').pop()?.toLowerCase()?.replace(/\?.*$/, '') || null;
  if (!inputExt) {
    throw new Error('音频文件名无效');
  }

  const coverExt = cover ? normalizeCoverExt(rawCoverExt) : null;
  if (cover && !coverExt) {
    throw new Error('专辑封面文件名无效');
  }

  const workDir = await mkdtemp(join(tmpdir(), 'qishui-embed-'));
  try {
    const sourceName = `input.${inputExt}`;
    let audioInputPath = await materializeInput(audio, workDir, sourceName);
    let audioInputExt = inputExt;

    let coverPath: string | null = null;
    if (cover && coverExt) {
      coverPath = await materializeInput(cover, workDir, `cover.${coverExt}`);
    }

    // 视频容器：有封面时先抽纯音轨再嵌封面；无封面且目标 m4a 时可一步完成
    if (isVideoContainerExt(inputExt)) {
      const canFinishInOnePass = !coverExt && outputFormat === 'm4a';
      const extractedPath = join(
        workDir,
        canFinishInOnePass ? `output.${outputFormat}` : 'extracted.m4a',
      );

      const extractArgs = [
        '-y',
        '-i',
        audioInputPath,
        '-map',
        '0:a:0',
        '-vn',
        '-c:a',
        'copy',
        ...(canFinishInOnePass ? buildMetadataArgs(metadata) : []),
        extractedPath,
      ];
      onLog?.(`extractArgs ${JSON.stringify(extractArgs)}`);
      await runFfmpeg(extractArgs, onLog);

      if (canFinishInOnePass) {
        const buffer = await readFile(extractedPath);
        if (outputPath) await writeFile(outputPath, buffer);
        return { buffer, outputFormat, outputPath };
      }

      audioInputPath = extractedPath;
      audioInputExt = 'm4a';
    }

    const finalOutputPath = join(workDir, `output.${outputFormat}`);
    const args = buildFfmpegArgs(
      audioInputPath,
      audioInputExt,
      coverPath,
      coverExt,
      metadata,
      outputFormat,
      finalOutputPath,
    );
    onLog?.(`args ${JSON.stringify(args)}`);
    await runFfmpeg(args, onLog);

    const buffer = await readFile(finalOutputPath);
    if (outputPath) await writeFile(outputPath, buffer);
    return { buffer, outputFormat, outputPath };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
};

export { OUTPUT_MIME };
