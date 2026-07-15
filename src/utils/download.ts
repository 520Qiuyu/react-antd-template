/** 通过blob下载 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * 将数据下载为 JSON 文件
 */
export const downloadAsJson = <T>(
  data: T,
  filename: string,
  options: { space?: number; timestamp?: boolean } = {},
) => {
  const { space = 2, timestamp = false } = options;
  const jsonString = JSON.stringify(data, null, space);
  const blob = new Blob([jsonString], { type: 'application/json' });

  let finalFilename = filename;
  if (timestamp) {
    const date = new Date();
    const timeString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate(),
    ).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(
      date.getMinutes(),
    ).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    finalFilename = `${filename}_${timeString}`;
  }

  downloadBlob(blob, `${finalFilename}.json`);
};

/** 通过url获取file Blob（直连，无 CORS 会失败） */
export const getFileBlob = async (url: string) => {
  const response = await fetch(url, {
    referrerPolicy: 'no-referrer',
    mode: 'cors',
    credentials: 'omit',
  });
  if (!response.ok) {
    throw new Error(`下载失败：${response.status} ${response.statusText}`);
  }
  return response.blob();
};

/**
 * 拉取图片 Blob：优先直连 fetch。
 * 失败时再试 Img + Canvas（仅 CDN 允许 CORS 时可用）；仍失败则返回 null。
 */
export const getCoverBlob = async (url: string): Promise<Blob | null> => {
  try {
    return await getFileBlob(url);
  } catch {
    // img 可展示 ≠ 可读像素；多数封面 CDN 禁 CORS，这里尽量再试一次
  }

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 canvas'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error('canvas 导出失败'))),
            'image/jpeg',
            0.92,
          );
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('封面图片加载失败'));
      img.src = url;
    });
    return blob;
  } catch {
    return null;
  }
};

interface IGetDownloadProgressOptions {
  onProgress?: (progress: { receivedLength: number; contentLength: number }) => void;
}
/** 通过url下载获取进度 */
export const getDownloadProgress = async (
  url: string,
  options: IGetDownloadProgressOptions = {},
) => {
  const { onProgress } = options;
  const res = await fetch(url, {
    referrerPolicy: 'no-referrer',
    mode: 'cors',
  });
  if (!res.ok) {
    throw new Error(`下载失败：${res.status} ${res.statusText}`);
  }
  const contentLength = Number(res.headers.get('content-length') || 0);
  let receivedLength = 0;
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('下载失败：没有body');
  }
  const chunks: BlobPart[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    receivedLength += value.length;
    onProgress?.({ receivedLength, contentLength });
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const blob = new Blob(chunks, { type: contentType });
  return blob;
};
