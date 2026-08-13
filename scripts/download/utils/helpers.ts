/**
 * 下载脚本通用工具：文件名、音质、并发、封面、歌词、同名检测。
 */
import { access, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import axios from 'axios';
import type { DownloadRuntimeConfig, PlaylistTrackItem, PlaylistUrlItem } from './types.ts';

const REQUEST_HEADERS = {
  Referer: 'https://qishui.douyin.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/** 清理文件名非法字符 */
export const sanitizeFilenamePart = (value: string) =>
  value.replace(/[\\/:*?"<>|]/g, '_').trim();

/**
 * 按模板生成不含扩展名的文件名。
 *
 * @example
 * resolveBasename({ index: 1, title: '晴天', artist: '周杰伦' }, '【歌名】-【歌手】')
 */
export const resolveBasename = (
  parts: { index?: number; title?: string; album?: string; artist?: string },
  nameFormat: string,
) => {
  const values: Record<string, string> = {
    序号: parts.index == null ? '' : String(parts.index),
    歌名: sanitizeFilenamePart(parts.title || '未知歌曲'),
    专辑名: sanitizeFilenamePart(parts.album || '未知专辑'),
    歌手: sanitizeFilenamePart(parts.artist || '未知歌手'),
  };
  const basename = nameFormat
    .replace(/【(序号|歌名|专辑名|歌手)】/g, (_, key: string) => values[key] ?? '')
    .trim();
  return basename || '未知歌曲';
};

/**
 * 按首选音质阶梯选取地址；缺失则降一级，最终回退到任意可用 url。
 *
 * @example
 * pickDownloadUrl(track.urls, 'hi_res', QUALITY_ORDER)
 */
export const pickDownloadUrl = (
  urls: PlaylistUrlItem[] = [],
  preferredQuality: string,
  qualityOrder: readonly string[],
): PlaylistUrlItem | undefined => {
  const usable = urls.filter((item) => Boolean(item.url));
  if (!usable.length) return undefined;

  const start = qualityOrder.indexOf(preferredQuality);
  const from = start >= 0 ? start : 0;

  for (let i = from; i < qualityOrder.length; i += 1) {
    const quality = qualityOrder[i];
    const matched = usable.find((item) => item.quality === quality);
    if (matched) return matched;
  }

  return usable[0];
};

/**
 * 限制并发执行任务列表。
 *
 * @example
 * await runWithConcurrency(list, 2, async (item, i) => { ... });
 */
export const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) => {
  if (items.length === 0) return;
  const limit = Math.max(1, concurrency);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      await worker(items[current], current);
    }
  });

  await Promise.all(runners);
};

/**
 * 拉取封面；失败返回 null。
 *
 * @example
 * const cover = await downloadCover(track.cover);
 */
export const downloadCover = async (coverUrl: string): Promise<Buffer | null> => {
  try {
    const res = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: 'arraybuffer',
      timeout: 30_000,
      headers: REQUEST_HEADERS,
    });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
};

/**
 * 下载音频二进制。
 *
 * @example
 * const buf = await downloadAudioBuffer(url);
 */
export const downloadAudioBuffer = async (url: string): Promise<Buffer> => {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 120_000,
    headers: REQUEST_HEADERS,
  });
  return Buffer.from(res.data);
};

/**
 * 同步写出歌词文件（.lrc / .txt）。
 *
 * @example
 * await saveLyricsFiles(track, '晴天-周杰伦', outDir, true);
 */
export const saveLyricsFiles = async (
  track: PlaylistTrackItem,
  basename: string,
  outDir: string,
  enabled: boolean,
) => {
  if (!enabled) return;

  const lrc = track.lrc?.trim();
  const lrcText = track.lrcText?.trim();
  if (!lrc && !lrcText) return;

  if (lrc) await writeFile(join(outDir, `${basename}.lrc`), lrc, 'utf-8');
};

/**
 * 判断输出目录是否已有同名音频。
 *
 * @example
 * await findExistingAudio(outDir, '晴天-周杰伦', config)
 */
export const findExistingAudio = async (
  outDir: string,
  basename: string,
  config: Pick<DownloadRuntimeConfig, 'embedMetadata' | 'downloadFormat'>,
) => {
  const exts = config.embedMetadata
    ? [config.downloadFormat, 'm4a', 'mp3', 'flac']
    : ['m4a', 'mp3', 'flac', config.downloadFormat];

  for (const ext of [...new Set(exts)]) {
    const filePath = join(outDir, `${basename}.${ext}`);
    try {
      await access(filePath);
      return filePath;
    } catch {
      /* 不存在 */
    }
  }
  return null;
};
