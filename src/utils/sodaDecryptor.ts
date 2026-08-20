import { ctr } from "@noble/ciphers/aes.js";

export interface Mp4Box {
  offset: number;
  size: number;
  data: Uint8Array;
}

export type SodaCodec = "mp4a" | "fLaC";

export interface DecryptDataResult {
  data: Uint8Array;
  decrypted: boolean;
  reason: string;
  codec?: SodaCodec;
}

export interface DecryptBlobResult {
  blob: Blob;
  decrypted: boolean;
  reason: string;
  codec?: SodaCodec;
}

interface ParsedBox {
  type: string;
  start: number;
  size: number;
  header: number;
  dataStart: number;
  dataEnd: number;
}

interface SampleRef {
  off: number;
  size: number;
  iv?: Uint8Array;
}

const ENCA_BYTES = new TextEncoder().encode("enca");
const MP4A_BYTES = new TextEncoder().encode("mp4a");
const FLAC_BYTES = new TextEncoder().encode("fLaC");
const DFLA_BYTES = new TextEncoder().encode("dfLa");
const SPADE_PREFIX = new Uint8Array([0xfa, 0x55]);

const concatBytes = (...parts: Uint8Array[]) => {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
};

const readUInt16BE = (data: Uint8Array, offset: number) =>
  new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0, false);

const readUInt32BE = (data: Uint8Array, offset: number) =>
  new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false);

const readInt32BE = (data: Uint8Array, offset: number) =>
  new DataView(data.buffer, data.byteOffset + offset, 4).getInt32(0, false);

const readBigUInt64BE = (data: Uint8Array, offset: number) =>
  new DataView(data.buffer, data.byteOffset + offset, 8).getBigUint64(0, false);

const bytesToAscii = (data: Uint8Array) =>
  String.fromCharCode(data[0], data[1], data[2], data[3]);

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const hexToBytes = (hex: string) => {
  const normalizedHex = hex.trim();
  const bytes = new Uint8Array(normalizedHex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(normalizedHex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
};

const indexOfBytes = (haystack: Uint8Array, needle: Uint8Array) => {
  if (!needle.length || haystack.length < needle.length) {
    return -1;
  }

  outer: for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[index + offset] !== needle[offset]) {
        continue outer;
      }
    }

    return index;
  }

  return -1;
};

const decryptAesCtr = (data: Uint8Array, keyBytes: Uint8Array, iv: Uint8Array) =>
  ctr(keyBytes, iv).decrypt(data);

/**
 * 读取一段字节流中的所有 box（支持 size=1 的 64 位扩展、size=0 延伸到 end）。
 */
const readBoxes = (buf: Uint8Array, start: number, end: number): ParsedBox[] => {
  const boxes: ParsedBox[] = [];
  let position = start;

  while (position + 8 <= end) {
    let size = readUInt32BE(buf, position);
    const type = bytesToAscii(buf.subarray(position + 4, position + 8));
    let header = 8;

    if (size === 1) {
      if (position + 16 > end) break;
      size = Number(readBigUInt64BE(buf, position + 8));
      header = 16;
    } else if (size === 0) {
      size = end - position;
    }

    if (size < 8 || position + size > end) break;

    boxes.push({
      type,
      start: position,
      size,
      header,
      dataStart: position + header,
      dataEnd: position + size,
    });
    position += size;
  }

  return boxes;
};

const findParsedBox = (boxes: ParsedBox[], type: string) =>
  boxes.find((box) => box.type === type) ?? null;

const findAllParsedBoxes = (boxes: ParsedBox[], type: string) =>
  boxes.filter((box) => box.type === type);

const getChildBox = (buf: Uint8Array, parent: ParsedBox, type: string) =>
  findParsedBox(readBoxes(buf, parent.dataStart, parent.dataEnd), type);

const getStbl = (buf: Uint8Array, trak: ParsedBox) => {
  const mdia = getChildBox(buf, trak, "mdia");
  if (!mdia) return null;
  const minf = getChildBox(buf, mdia, "minf");
  if (!minf) return null;
  return getChildBox(buf, minf, "stbl");
};

const parseSampleSizes = (buf: Uint8Array, stsz: ParsedBox) => {
  const sampleSizeFixed = readUInt32BE(buf, stsz.dataStart + 4);
  const sampleCount = readUInt32BE(buf, stsz.dataStart + 8);

  if (sampleSizeFixed) {
    return Array.from({ length: sampleCount }, () => sampleSizeFixed);
  }

  return Array.from({ length: sampleCount }, (_, index) =>
    readUInt32BE(buf, stsz.dataStart + 12 + index * 4),
  );
};

const parseChunkOffsets = (buf: Uint8Array, offsetBox: ParsedBox) => {
  const is64 = offsetBox.type === "co64";
  const chunkCount = readUInt32BE(buf, offsetBox.dataStart + 4);
  const offsets: number[] = [];
  let pointer = offsetBox.dataStart + 8;

  for (let index = 0; index < chunkCount; index += 1) {
    if (is64) {
      offsets.push(Number(readBigUInt64BE(buf, pointer)));
      pointer += 8;
    } else {
      offsets.push(readUInt32BE(buf, pointer));
      pointer += 4;
    }
  }

  return offsets;
};

const parseStscEntries = (buf: Uint8Array, stsc: ParsedBox) => {
  const entryCount = readUInt32BE(buf, stsc.dataStart + 4);
  const entries: Array<{ firstChunk: number; spc: number }> = [];
  let pointer = stsc.dataStart + 8;

  for (let index = 0; index < entryCount; index += 1) {
    entries.push({
      firstChunk: readUInt32BE(buf, pointer),
      spc: readUInt32BE(buf, pointer + 4),
    });
    pointer += 12;
  }

  return entries;
};

const samplesPerChunk = (
  entries: Array<{ firstChunk: number; spc: number }>,
  chunkIndex1: number,
) => {
  let spc = entries[0]?.spc ?? 1;
  for (const entry of entries) {
    if (chunkIndex1 >= entry.firstChunk) spc = entry.spc;
  }
  return spc;
};

const buildSamples = (
  sizes: number[],
  chunkOffsets: number[],
  stscEntries: Array<{ firstChunk: number; spc: number }>,
) => {
  const samples: SampleRef[] = [];
  let sampleIndex = 0;

  for (let chunkIndex = 0; chunkIndex < chunkOffsets.length; chunkIndex += 1) {
    const spc = samplesPerChunk(stscEntries, chunkIndex + 1);
    let offset = chunkOffsets[chunkIndex];

    for (let index = 0; index < spc && sampleIndex < sizes.length; index += 1) {
      samples.push({ off: offset, size: sizes[sampleIndex] });
      offset += sizes[sampleIndex];
      sampleIndex += 1;
    }
  }

  return { samples, mappedCount: sampleIndex };
};

const parseSencIvs = (buf: Uint8Array, senc: ParsedBox) => {
  const ivs: Uint8Array[] = [];
  let pointer = senc.dataStart;
  const versionFlags = readUInt32BE(buf, pointer);
  const flags = versionFlags & 0xffffff;
  const sampleCount = readUInt32BE(buf, pointer + 4);
  pointer += 8;
  const ivSize = versionFlags >>> 24 === 1 ? 16 : 8;

  for (let index = 0; index < sampleCount; index += 1) {
    ivs.push(buf.subarray(pointer, pointer + ivSize));
    pointer += ivSize;

    if ((flags & 0x02) !== 0) {
      const subCount = readUInt16BE(buf, pointer);
      pointer += 2 + subCount * 6;
    }
  }

  return ivs;
};

const decryptSample = (buf: Uint8Array, sample: SampleRef, keyBytes: Uint8Array) => {
  const counter = new Uint8Array(16);
  if (sample.iv) {
    counter.set(sample.iv.subarray(0, Math.min(sample.iv.length, 16)));
  }
  return decryptAesCtr(buf.subarray(sample.off, sample.off + sample.size), keyBytes, counter);
};

/**
 * 把 stsd 的 `enca` sample entry 补丁回真实 codec：
 * 内层含 `dfLa` → `fLaC`（lossless FLAC-in-MP4），否则 `mp4a`。
 */
const patchSampleEntry = (
  output: Uint8Array,
  data: Uint8Array,
  stsd: ParsedBox,
): SodaCodec => {
  const region = data.subarray(stsd.dataStart, stsd.dataEnd);
  const encaIndex = indexOfBytes(region, ENCA_BYTES);
  if (encaIndex < 0) return "mp4a";

  const inner = region.subarray(encaIndex + 8);
  const codec: SodaCodec = indexOfBytes(inner, DFLA_BYTES) >= 0 ? "fLaC" : "mp4a";
  output.set(codec === "fLaC" ? FLAC_BYTES : MP4A_BYTES, stsd.dataStart + encaIndex);
  return codec;
};

const pickEncryptedTrak = (buf: Uint8Array, traks: ParsedBox[]) => {
  for (const trak of traks) {
    const stbl = getStbl(buf, trak);
    if (!stbl) continue;
    const stsd = getChildBox(buf, stbl, "stsd");
    if (!stsd) continue;
    if (indexOfBytes(buf.subarray(stsd.dataStart, stsd.dataEnd), ENCA_BYTES) >= 0) {
      return trak;
    }
  }
  return traks[0] ?? null;
};

const decryptNonFragmented = (
  data: Uint8Array,
  output: Uint8Array,
  keyBytes: Uint8Array,
  moov: ParsedBox,
): DecryptDataResult => {
  const traks = findAllParsedBoxes(readBoxes(data, moov.dataStart, moov.dataEnd), "trak");
  const trak = pickEncryptedTrak(data, traks);
  if (!trak) return { data, decrypted: false, reason: "trak box not found" };

  const stbl = getStbl(data, trak);
  if (!stbl) return { data, decrypted: false, reason: "stbl box not found" };

  const stblBoxes = readBoxes(data, stbl.dataStart, stbl.dataEnd);
  const stsz = findParsedBox(stblBoxes, "stsz");
  const stco = findParsedBox(stblBoxes, "stco");
  const co64 = findParsedBox(stblBoxes, "co64");
  const stsc = findParsedBox(stblBoxes, "stsc");
  const stsd = findParsedBox(stblBoxes, "stsd");
  const senc = findParsedBox(stblBoxes, "senc");
  const offsetBox = stco ?? co64;

  if (!stsz || !offsetBox || !stsc) {
    return { data, decrypted: false, reason: "missing sample tables (stsz/stco/stsc)" };
  }
  if (!senc) return { data, decrypted: false, reason: "senc box not found" };

  const sizes = parseSampleSizes(data, stsz);
  const chunkOffsets = parseChunkOffsets(data, offsetBox);
  const stscEntries = parseStscEntries(data, stsc);
  const { samples, mappedCount } = buildSamples(sizes, chunkOffsets, stscEntries);

  if (mappedCount !== sizes.length) {
    return {
      data,
      decrypted: false,
      reason: `sample count mismatch: ${mappedCount} != ${sizes.length}`,
    };
  }

  const ivs = parseSencIvs(data, senc);
  if (ivs.length !== samples.length) {
    return {
      data,
      decrypted: false,
      reason: `senc iv count ${ivs.length} != samples ${samples.length}`,
    };
  }

  for (let index = 0; index < samples.length; index += 1) {
    samples[index].iv = ivs[index];
  }

  for (const sample of samples) {
    if (sample.off + sample.size > data.length) {
      return { data, decrypted: false, reason: "sample offset out of range" };
    }
    output.set(decryptSample(data, sample, keyBytes), sample.off);
  }

  const codec = stsd ? patchSampleEntry(output, data, stsd) : "mp4a";
  return { data: output, decrypted: true, reason: "decrypted", codec };
};

const decryptFragmented = (
  data: Uint8Array,
  output: Uint8Array,
  keyBytes: Uint8Array,
  top: ParsedBox[],
  moov: ParsedBox,
): DecryptDataResult => {
  let codec: SodaCodec = "mp4a";

  for (let boxIndex = 0; boxIndex < top.length; boxIndex += 1) {
    const current = top[boxIndex];
    if (current.type !== "moof") continue;

    const mdatRegions: ParsedBox[] = [];
    for (let nextIndex = boxIndex + 1; nextIndex < top.length; nextIndex += 1) {
      if (top[nextIndex].type === "moof") break;
      if (top[nextIndex].type === "mdat") mdatRegions.push(top[nextIndex]);
    }

    const traf = getChildBox(data, current, "traf");
    if (!traf) return { data, decrypted: false, reason: "fragmented: missing traf" };

    const tfhd = getChildBox(data, traf, "tfhd");
    const trun = getChildBox(data, traf, "trun");
    const senc = getChildBox(data, traf, "senc");
    if (!tfhd || !trun) {
      return { data, decrypted: false, reason: "fragmented: missing tfhd/trun" };
    }

    let pointer = tfhd.dataStart;
    const tfFlags = readUInt32BE(data, pointer) & 0xffffff;
    pointer += 8;

    let baseDataOffset = current.dataEnd;
    if (tfFlags & 0x000001) {
      baseDataOffset = Number(readBigUInt64BE(data, pointer));
      pointer += 8;
    } else if (tfFlags & 0x000010) {
      baseDataOffset = Number(readBigUInt64BE(data, pointer));
      pointer += 8;
    }

    let trunPointer = trun.dataStart;
    const trFlags = readUInt32BE(data, trunPointer) & 0xffffff;
    const sampleCount = readUInt32BE(data, trunPointer + 4);
    trunPointer += 8;

    let dataOffset = 0;
    if (trFlags & 0x000001) {
      dataOffset = readInt32BE(data, trunPointer);
      trunPointer += 4;
    }

    const sampleSizes: number[] = [];
    for (let index = 0; index < sampleCount; index += 1) {
      if (trFlags & 0x000100) {
        sampleSizes.push(readUInt32BE(data, trunPointer));
        trunPointer += 4;
      }
      if (trFlags & 0x000200) trunPointer += 4;
      if (trFlags & 0x000800) trunPointer += 4;
      if (trFlags & 0x001000) trunPointer += 4;
      if (!(trFlags & 0x000100)) sampleSizes.push(0);
    }

    const ivs = senc ? parseSencIvs(data, senc) : [];
    let offset = baseDataOffset + dataOffset;
    const dataStart = mdatRegions[0]?.dataStart ?? 0;
    if (offset < dataStart) offset = dataStart + offset;

    for (let index = 0; index < sampleCount; index += 1) {
      const size = sampleSizes[index];
      const iv = ivs[index];
      if (!iv) return { data, decrypted: false, reason: "fragmented: no IV for sample" };

      if (offset + size <= data.length) {
        output.set(decryptSample(data, { off: offset, size, iv }, keyBytes), offset);
      }
      offset += size;
    }
  }

  const moovBoxes = readBoxes(data, moov.dataStart, moov.dataEnd);
  for (const trak of findAllParsedBoxes(moovBoxes, "trak")) {
    const stbl = getStbl(data, trak);
    const stsd = stbl ? getChildBox(data, stbl, "stsd") : null;
    if (stsd) codec = patchSampleEntry(output, data, stsd);
  }

  return { data: output, decrypted: true, reason: "decrypted", codec };
};

const decryptCenc = (fileData: Uint8Array, keyBytes: Uint8Array): DecryptDataResult => {
  const top = readBoxes(fileData, 0, fileData.length);
  const moov = findParsedBox(top, "moov");
  if (!moov) return { data: fileData, decrypted: false, reason: "moov box not found" };

  const output = new Uint8Array(fileData);
  const isFragmented = findAllParsedBoxes(top, "moof").length > 0;

  if (isFragmented) {
    return decryptFragmented(fileData, output, keyBytes, top, moov);
  }

  return decryptNonFragmented(fileData, output, keyBytes, moov);
};

class SpadeDecryptor {
  private static bitCount(value: number) {
    let current = value >>> 0;
    current -= (current >>> 1) & 0x55555555;
    current = (current & 0x33333333) + ((current >>> 2) & 0x33333333);
    return (((current + (current >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }

  private static decodeBase36(value: number) {
    if (value >= 48 && value <= 57) return value - 48;
    if (value >= 97 && value <= 122) return value - 97 + 10;
    return 0xff;
  }

  private static decryptSpadeInner(spadeKeyBytes: Uint8Array) {
    const result = new Uint8Array(spadeKeyBytes.length);
    const buff = concatBytes(SPADE_PREFIX, spadeKeyBytes);

    for (let index = 0; index < result.length; index += 1) {
      const raw = (spadeKeyBytes[index] ^ buff[index]) - SpadeDecryptor.bitCount(index) - 21;
      result[index] = raw >= 0 ? raw : ((raw % 255) + 255) % 255;
    }

    return result;
  }

  static extractKey(playAuth: string) {
    const bytes = base64ToBytes(playAuth);
    if (bytes.length < 3) return null;

    const paddingLength = (bytes[0] ^ bytes[1] ^ bytes[2]) - 48;
    if (bytes.length < paddingLength + 2) return null;

    const tmpBuff = SpadeDecryptor.decryptSpadeInner(
      bytes.subarray(1, bytes.length - paddingLength),
    );
    if (!tmpBuff.length) return null;

    const endIndex =
      1 + (bytes.length - paddingLength - 2) - SpadeDecryptor.decodeBase36(tmpBuff[0]);
    return new TextDecoder().decode(tmpBuff.subarray(1, endIndex));
  }
}

/**
 * 解密汽水音乐 Soda 加密的 m4a/mp4 音频数据。
 *
 * @example
 * const blob = await fetch(audioUrl).then(res => res.blob());
 * const { blob: decryptedBlob } = await SodaAudioDecryptor.decryptBlob(blob, playAuth);
 */
export class SodaAudioDecryptor {
  static findBox(data: Uint8Array, boxType: string, start = 0, end = data.length): Mp4Box | null {
    const found = findParsedBox(readBoxes(data, start, end), boxType);
    if (!found) return null;

    return {
      offset: found.start,
      size: found.size,
      data: data.subarray(found.dataStart, found.dataEnd),
    };
  }

  static async decryptData(fileData: Uint8Array, playAuth: string): Promise<DecryptDataResult> {
    const hexKey = SpadeDecryptor.extractKey(playAuth);
    if (!hexKey) {
      return { data: fileData, decrypted: false, reason: "playAuth key extraction failed" };
    }

    return decryptCenc(fileData, hexToBytes(hexKey));
  }

  /**
   * 解密浏览器中的音频 Blob。
   *
   * @example
   * const encryptedBlob = await getFileBlob(audioUrl);
   * const { blob } = await SodaAudioDecryptor.decryptBlob(encryptedBlob, playAuth);
   */
  static async decryptBlob(blob: Blob, playAuth: string): Promise<DecryptBlobResult> {
    const fileData = new Uint8Array(await blob.arrayBuffer());
    const result = await SodaAudioDecryptor.decryptData(fileData, playAuth);
    return {
      blob: new Blob([new Uint8Array(result.data)], { type: blob.type || "audio/mp4" }),
      decrypted: result.decrypted,
      reason: result.reason,
      codec: result.codec,
    };
  }
}
