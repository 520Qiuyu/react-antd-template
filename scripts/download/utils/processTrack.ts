/**
 * 单曲流水线：跳过检测 → 下载 → 解密 → 内嵌 → 落盘 → 歌词。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { embedMetadata } from './embedAudioMetadata.ts';
import {
  downloadAudioBuffer,
  downloadCover,
  findExistingAudio,
  pickDownloadUrl,
  resolveBasename,
  saveLyricsFiles,
} from './helpers.ts';
import { SodaAudioDecryptor } from './sodaDecryptor.ts';
import type { TerminalBoard } from './terminalBoard.ts';
import type { DownloadRuntimeConfig, PlaylistTrackItem } from './types.ts';

/** 临时：把封面落盘到 output/<歌单>/covers/，便于肉眼检查 */
const DEBUG_SAVE_COVER = false;

/**
 * 根据文件头猜封面扩展名。
 * @example
 * guessCoverExt(buf) // 'jpg' | 'png' | 'webp' | 'bin'
 */
const guessCoverExt = (data: Buffer) => {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpg';
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'png';
  if (
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return 'bin';
};

/**
 * 临时保存封面到 covers 目录。
 * @example
 * await debugSaveCover(outDir, '晴天-周杰伦', coverBuffer);
 */
const debugSaveCover = async (outDir: string, basename: string, coverBuffer: Buffer) => {
  if (!DEBUG_SAVE_COVER) return;
  const coversDir = join(outDir, 'covers');
  await mkdir(coversDir, { recursive: true });
  const ext = guessCoverExt(coverBuffer);
  const coverPath = join(coversDir, `${basename}.${ext}`);
  await writeFile(coverPath, coverBuffer);
  console.log(
    `[封面已保存] ${coverPath} (${coverBuffer.length} bytes, head=${coverBuffer
      .subarray(0, 8)
      .toString('hex')})`,
  );
};

/**
 * 处理单首曲目。
 *
 * @example
 * await processTrack(track, 0, outDir, board, config);
 */
export const processTrack = async (
  track: PlaylistTrackItem,
  index: number,
  outDir: string,
  board: TerminalBoard,
  config: DownloadRuntimeConfig,
) => {
  const order = index + 1;
  const title = track.title || '未知歌曲';
  const artist = track.artist || '未知歌手';
  const label = `${String(order).padStart(2, '0')} ${title} - ${artist}`;

  const basename = resolveBasename(
    {
      index: order,
      title: track.title,
      album: track.album,
      artist: track.artist,
    },
    config.nameFormat,
  );

  const existingPath = await findExistingAudio(outDir, basename, config);
  if (existingPath) {
    board.setActive(index, label, '跳过', existingPath.split('.').pop());
    return;
  }

  const urlItem = pickDownloadUrl(track.urls, config.preferredQuality, config.qualityOrder);
  if (!urlItem?.url) {
    throw new Error('没有可下载的音质地址');
  }

  board.setActive(index, label, '下载', urlItem.quality || 'unknown');
  let audioBuffer = await downloadAudioBuffer(urlItem.url);

  if (urlItem.playAuth) {
    board.setActive(index, label, '解密', urlItem.quality || 'unknown');
    const decrypted = await SodaAudioDecryptor.decryptAxiosData(audioBuffer, urlItem.playAuth);
    if (!decrypted.decrypted) {
      throw new Error(decrypted.reason || '解密失败');
    }
    audioBuffer = Buffer.from(decrypted.buffer);
  }

  const sourceExt = (urlItem.format || 'm4a').replace(/^\./, '') || 'm4a';
  let finalBuffer = audioBuffer;
  let finalExt = sourceExt;

  // 临时：无论是否内嵌，都先把封面下下来给你看
  let coverBuffer: Buffer | null = null;
  if ((DEBUG_SAVE_COVER || config.embedMetadata) && track.cover) {
    board.setActive(index, label, '封面');
    coverBuffer = await downloadCover(track.cover);
    if (coverBuffer) {
      await debugSaveCover(outDir, basename, coverBuffer);
    } else {
      console.warn(`[封面] ${label} 下载失败/为空`);
    }
  }

  if (config.embedMetadata) {
    const coverExt =
      (coverBuffer && guessCoverExt(coverBuffer)) ||
      track.cover?.split('?')[0].split('.').pop()?.toLowerCase()?.replace(/jpe?g/, 'jpg') ||
      'jpg';

    try {
      board.setActive(index, label, '内嵌', config.downloadFormat);
      const result = await embedMetadata({
        audio: audioBuffer,
        audioName: `${basename}.${sourceExt}`,
        cover: coverBuffer,
        coverName: coverBuffer ? `cover.${coverExt}` : undefined,
        outputFormat: config.downloadFormat,
        sourceCodec: urlItem.codec,
        metadata: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          lyrics: track.lrc || track.lrcText,
        },
      });
      finalBuffer = Buffer.from(result.buffer);
      finalExt = result.outputFormat;
    } catch {
      // 内嵌失败则保存解密后的原始音频
    }
  }

  board.setActive(index, label, '保存', finalExt);
  await writeFile(join(outDir, `${basename}.${finalExt}`), finalBuffer);

  if (config.syncLyrics) {
    board.setActive(index, label, '歌词');
    await saveLyricsFiles(track, basename, outDir, true);
  }
};
