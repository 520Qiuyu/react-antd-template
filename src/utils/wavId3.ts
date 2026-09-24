/** foobar2000 写入 WAV 时使用的 RIFF 块名（fourcc 为 "id3 "） */
const ID3_CHUNK_ID = 'id3 ';

export interface WavId3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: string;
  lyrics?: string;
  comment?: string;
}

/**
 * 把标题、艺人、专辑、歌词和封面写成 foobar2000 能读的 WAV `id3 ` 块。
 * ffmpeg 的 wav muxer 不能挂第二路封面流，`-write_id3v2` 又把标签放在 RIFF 外面，播放器读不到。
 *
 * @example
 * ```ts
 * const tagged = injectWavId3(wavBytes, { title: '歌名', artist: '歌手', lyrics: '歌词' }, coverBytes, 'image/jpeg');
 * ```
 */
export const injectWavId3 = (
  wav: Uint8Array,
  metadata: WavId3Metadata,
  cover?: Uint8Array | null,
  coverMime?: string | null,
) => {
  const tag = buildId3v23Tag(metadata, cover, coverMime);
  if (!tag) return wav;
  return insertId3Chunk(wav, tag);
};

/**
 * 按封面扩展名得到 APIC 的 MIME。
 *
 * @example
 * ```ts
 * coverMimeFromExt('jpeg') // 'image/jpeg'
 * ```
 */
export const coverMimeFromExt = (ext?: string | null) => {
  const normalized = ext?.toLowerCase();
  if (normalized === 'png') return 'image/png';
  if (normalized === 'gif') return 'image/gif';
  if (normalized === 'webp') return 'image/webp';
  if (normalized === 'bmp') return 'image/bmp';
  return 'image/jpeg';
};

const buildId3v23Tag = (
  metadata: WavId3Metadata,
  cover?: Uint8Array | null,
  coverMime?: string | null,
) => {
  const frames: Uint8Array[] = [];
  const pushText = (id: string, value?: string) => {
    const text = value?.trim();
    if (text) frames.push(textFrame(id, text));
  };

  pushText('TIT2', metadata.title);
  pushText('TPE1', metadata.artist);
  pushText('TALB', metadata.album);
  pushText('TPE2', metadata.albumArtist);
  pushText('TCON', metadata.genre);
  pushText('TYER', metadata.year);
  if (metadata.lyrics?.trim()) frames.push(usltFrame(metadata.lyrics.trim()));
  if (metadata.comment?.trim()) frames.push(commFrame(metadata.comment.trim()));
  if (cover?.byteLength) frames.push(apicFrame(coverMime || 'image/jpeg', cover));

  if (frames.length === 0) return null;

  const body = concatBytes(frames);
  const tag = new Uint8Array(10 + body.length);
  tag.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00], 0);
  writeSyncSafe(tag, 6, body.length);
  tag.set(body, 10);
  return tag;
};

/** ID3v2.3 文本帧，UTF-16 以兼容中文 */
const textFrame = (id: string, value: string) => frame(id, concatBytes([new Uint8Array([0x01]), encodeUtf16(value)]));

/** 未同步歌词，对应 foobar 的歌词页 */
const usltFrame = (lyrics: string) => frame('USLT', textWithDescriptor(lyrics, 'zho'));

const commFrame = (comment: string) => frame('COMM', textWithDescriptor(comment, 'eng'));

const textWithDescriptor = (text: string, language: string) => {
  const lang = new TextEncoder().encode(language.slice(0, 3).padEnd(3, 'x'));
  const descriptor = concatBytes([encodeUtf16(''), new Uint8Array([0x00, 0x00])]);
  return concatBytes([new Uint8Array([0x01]), lang, descriptor, encodeUtf16(text)]);
};

/** 封面走 APIC，picture type 3 = front cover */
const apicFrame = (mime: string, image: Uint8Array) => {
  const mimeBytes = new TextEncoder().encode(mime);
  const description = new TextEncoder().encode('Cover');
  return frame(
    'APIC',
    concatBytes([
      new Uint8Array([0x00]),
      mimeBytes,
      new Uint8Array([0x00, 0x03]),
      description,
      new Uint8Array([0x00]),
      image,
    ]),
  );
};

const frame = (id: string, body: Uint8Array) => {
  const out = new Uint8Array(10 + body.length);
  out.set(new TextEncoder().encode(id), 0);
  new DataView(out.buffer).setUint32(4, body.length, false);
  out.set(body, 10);
  return out;
};

const encodeUtf16 = (text: string) => {
  const bytes = new Uint8Array(2 + text.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    bytes[2 + index * 2] = code & 0xff;
    bytes[3 + index * 2] = code >> 8;
  }
  return bytes;
};

const writeSyncSafe = (target: Uint8Array, offset: number, size: number) => {
  target[offset] = (size >> 21) & 0x7f;
  target[offset + 1] = (size >> 14) & 0x7f;
  target[offset + 2] = (size >> 7) & 0x7f;
  target[offset + 3] = size & 0x7f;
};

const concatBytes = (parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
};

const readAscii = (bytes: Uint8Array, offset: number, length: number) =>
  String.fromCharCode(...bytes.subarray(offset, offset + length));

const readU32LE = (bytes: Uint8Array, offset: number) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);

const writeU32LE = (bytes: Uint8Array, offset: number, value: number) => {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value, true);
};

/**
 * 在 data 块前插入 id3 块，并修正 RIFF 总长度。已有 id3 块则替换。
 */
const insertId3Chunk = (wav: Uint8Array, tag: Uint8Array) => {
  if (wav.length < 12 || readAscii(wav, 0, 4) !== 'RIFF' || readAscii(wav, 8, 4) !== 'WAVE') {
    throw new Error('WAV 文件头无效，无法写入 ID3');
  }

  const chunk = new Uint8Array(8 + tag.length + (tag.length % 2));
  chunk.set(new TextEncoder().encode(ID3_CHUNK_ID), 0);
  writeU32LE(chunk, 4, tag.length);
  chunk.set(tag, 8);

  let offset = 12;
  let dataOffset = wav.length;
  let existingOffset = -1;
  let existingSpan = 0;

  while (offset + 8 <= wav.length) {
    const id = readAscii(wav, offset, 4);
    const size = readU32LE(wav, offset + 4);
    const span = 8 + size + (size % 2);
    if (offset + span > wav.length) break;
    if (id === ID3_CHUNK_ID && existingOffset < 0) {
      existingOffset = offset;
      existingSpan = span;
    }
    if (id === 'data' && dataOffset === wav.length) dataOffset = offset;
    offset += span;
  }

  const insertAt = existingOffset >= 0 ? existingOffset : dataOffset;
  const removeSpan = existingOffset >= 0 ? existingSpan : 0;
  const next = new Uint8Array(wav.length - removeSpan + chunk.length);
  next.set(wav.subarray(0, insertAt), 0);
  next.set(chunk, insertAt);
  next.set(wav.subarray(insertAt + removeSpan), insertAt + chunk.length);
  writeU32LE(next, 4, next.length - 8);
  return next;
};
