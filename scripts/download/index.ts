/**
 * 歌单 JSON 一键下载：下载 → 解密 → 内嵌元信息/封面/歌词。
 *
 * @example
 * pnpm download
 * pnpm download ./xxx.json
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DownloadRuntimeConfig,
  type EmbedOutputFormat,
  type PlaylistExportJson,
  processTrack,
  runWithConcurrency,
  sanitizeFilenamePart,
  TerminalBoard,
} from './utils/index.ts';

// ======================== 可调常量 ========================

/** 要下载的歌单 json 路径（相对本脚本目录；也可 CLI 传参覆盖） */
const DOWNLOAD_JSON_PATH = './车载DJ抖音热歌DJ8D全景环绕车载超重低音开车犯困必听嗨曲.json';
/** 首选下载音质（缺失则按阶梯降级） */
const PREFERRED_QUALITY = 'spatial' as const;
/** 并发数 */
const DOWNLOAD_CONCURRENCY = 6;
/** 下载格式：内嵌后的输出容器 */
const DOWNLOAD_FORMAT: EmbedOutputFormat = 'mp3';
/** 文件名模板：【序号】【歌名】【专辑名】【歌手】 */
const DOWNLOAD_NAME_FORMAT = '【歌名】-【歌手】';
/** 是否同步下载歌词文件 */
const DOWNLOAD_SYNC_LYRICS = true;
/** 是否内嵌元信息（排查时可先关，只保存解密后的原始 m4a） */
const DOWNLOAD_EMBED_METADATA = true;


/** 音质优先阶梯：从高到低 */
const DOWNLOAD_QUALITY_ORDER = [
  'spatial',
  'hi_res',
  'highest',
  'higher',
  'medium',
  'lossless',
  'hq',
  'standard',
] as const;

// ======================== 主程序 ========================

const __dirname = dirname(fileURLToPath(import.meta.url));

const runtimeConfig: DownloadRuntimeConfig = {
  preferredQuality: PREFERRED_QUALITY,
  qualityOrder: DOWNLOAD_QUALITY_ORDER,
  downloadFormat: DOWNLOAD_FORMAT,
  nameFormat: DOWNLOAD_NAME_FORMAT,
  syncLyrics: DOWNLOAD_SYNC_LYRICS,
  embedMetadata: DOWNLOAD_EMBED_METADATA,
};

/**
 * 解析参数并启动批量下载。
 *
 * @example
 * await main();
 */
const main = async () => {
  const argPath = process.argv[2];
  const jsonPath = argPath
    ? isAbsolute(argPath)
      ? argPath
      : resolve(process.cwd(), argPath)
    : resolve(__dirname, DOWNLOAD_JSON_PATH);

  const raw = await readFile(jsonPath, 'utf-8');
  const data = JSON.parse(raw) as PlaylistExportJson;
  const playlistName = sanitizeFilenamePart(data.歌单名 || '歌单');
  const list = data.list || [];

  if (!list.length) {
    console.log('[结束] 歌单列表为空');
    return;
  }

  const outDir = join(__dirname, 'output', playlistName);
  await mkdir(outDir, { recursive: true });

  const board = new TerminalBoard({
    title: playlistName,
    total: list.length,
    outDir,
    config: {
      quality: PREFERRED_QUALITY,
      concurrency: DOWNLOAD_CONCURRENCY,
      format: DOWNLOAD_FORMAT,
      embed: DOWNLOAD_EMBED_METADATA,
      lyrics: DOWNLOAD_SYNC_LYRICS,
    },
  });

  await runWithConcurrency(list, DOWNLOAD_CONCURRENCY, async (track, index) => {
    try {
      await processTrack(track, index, outDir, board, runtimeConfig);
      board.markDone(index, true);
    } catch (error) {
      board.markDone(index, false, error instanceof Error ? error.message : String(error));
    }
  });

  board.finish();
};

main().catch((error) => {
  console.error('[致命]', error);
  process.exitCode = 1;
});
