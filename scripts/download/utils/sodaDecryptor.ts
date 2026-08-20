/**
 * Node 可用的汽水音乐 Soda m4a/mp4 解密工具（浏览器版见 src/utils/sodaDecryptor.ts）。
 *
 * @example
 * import { SodaAudioDecryptor } from './sodaDecryptor.ts';
 * const { data, decrypted } = await SodaAudioDecryptor.decryptData(fileBytes, playAuth);
 * await SodaAudioDecryptor.decryptFile('in.m4a', 'out.m4a', playAuth);
 *
 * // axios arraybuffer（无需先落盘）
 * const res = await axios.get(url, { responseType: 'arraybuffer' });
 * const { buffer } = await SodaAudioDecryptor.decryptAxiosData(res.data, playAuth);
 * await writeFile('out.m4a', buffer);
 */
import { readFile, writeFile } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import {
  SodaAudioDecryptor as BrowserSodaAudioDecryptor,
  type DecryptDataResult,
} from '../../../src/utils/sodaDecryptor.ts';

export type {
  DecryptBlobResult,
  DecryptDataResult,
  Mp4Box,
  SodaCodec,
} from '../../../src/utils/sodaDecryptor.ts';

/** Node 侧常用：附带 Buffer，可直接 writeFile */
export interface DecryptBufferResult extends DecryptDataResult {
  buffer: Buffer;
}

export interface DecryptFileResult {
  decrypted: boolean;
  reason: string;
  outputPath: string;
}

/** axios / Node 常见二进制输入 */
export type BinaryInput = ArrayBuffer | SharedArrayBuffer | Buffer | Uint8Array;

/**
 * 将 axios/Node 二进制输入转为 Uint8Array。
 *
 * @example
 * const bytes = toUint8Array(res.data); // responseType: 'arraybuffer'
 */
const toUint8Array = (input: BinaryInput): Uint8Array => {
  if (input instanceof Uint8Array) return input;
  if (Buffer.isBuffer(input)) return new Uint8Array(input);
  return new Uint8Array(input);
};

/**
 * 将可读流完整读入内存（MP4 解密需随机访问，无法真正边下边解）。
 *
 * @example
 * const bytes = await readStreamToUint8Array(res.data); // responseType: 'stream'
 */
const readStreamToUint8Array = async (stream: Readable): Promise<Uint8Array> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
};

/**
 * Node 环境下解密汽水音乐 Soda 加密的 m4a/mp4。
 */
export class SodaAudioDecryptor extends BrowserSodaAudioDecryptor {
  /**
   * 解密 axios `responseType: 'arraybuffer'`（或 Buffer/Uint8Array）返回的内存数据，无需先保存文件。
   *
   * @example
   * const res = await axios.get(audioUrl, { responseType: 'arraybuffer' });
   * const { buffer, decrypted, reason } = await SodaAudioDecryptor.decryptAxiosData(
   *   res.data,
   *   playAuth,
   * );
   * if (decrypted) await writeFile('out.m4a', buffer);
   */
  static async decryptAxiosData(
    data: BinaryInput,
    playAuth: string,
  ): Promise<DecryptBufferResult> {
    const result = await SodaAudioDecryptor.decryptData(toUint8Array(data), playAuth);
    return {
      ...result,
      buffer: Buffer.from(result.data),
    };
  }

  /**
   * 解密 axios `responseType: 'stream'` 的可读流：先读入内存再解密（无法真正流式解密）。
   *
   * @example
   * const res = await axios.get(audioUrl, { responseType: 'stream' });
   * const { buffer, decrypted } = await SodaAudioDecryptor.decryptStream(res.data, playAuth);
   */
  static async decryptStream(stream: Readable, playAuth: string): Promise<DecryptBufferResult> {
    const fileData = await readStreamToUint8Array(stream);
    return SodaAudioDecryptor.decryptAxiosData(fileData, playAuth);
  }

  /**
   * 读取加密文件、解密后写入目标路径。
   *
   * @example
   * const result = await SodaAudioDecryptor.decryptFile('a.m4a', 'a.dec.m4a', playAuth);
   * if (!result.decrypted) console.error(result.reason);
   */
  static async decryptFile(
    inputPath: string,
    outputPath: string,
    playAuth: string,
  ): Promise<DecryptFileResult> {
    const fileData = new Uint8Array(await readFile(inputPath));
    const result = await SodaAudioDecryptor.decryptData(fileData, playAuth);
    await writeFile(outputPath, result.data);
    return {
      decrypted: result.decrypted,
      reason: result.reason,
      outputPath,
    };
  }
}
