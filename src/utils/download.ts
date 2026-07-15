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

/** 通过url获取file Blob */
export const getFileBlob = async (url: string) => {
  const response = await fetch(url, {
    referrerPolicy: 'no-referrer',
    mode: 'cors',
  });
  const blob = await response.blob();
  return blob;
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
