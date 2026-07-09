/** 通过url下载 */
export function downloadByUrl(url: string, params: Record<string, any> = {}, name: string = '') {
  // 去除params中的空值参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined),
  );
  // 将url和params对象拼接成完整的url
  const fullUrl = `${window.baseUrl}/${url}?${new URLSearchParams(
    filteredParams,
  ).toString()}`.replace(/[\/]+/g, '/');
  console.log('fullUrl', fullUrl);
  window.open(fullUrl);
}
/** 获取完整url */
export function getFullFileUrl(fileId: string) {
  return `api/docrepo/download?attachmentId=${fileId}`;
}
/** 通过文件id下载 */
export function downloadByFileId(fileId: string, name: string = '') {
  const a = document.createElement('a');
  a.href = getFullFileUrl(fileId);
  a.download = name;
  a.target = '_blank';
  a.click();
}

/**
 * 将数据下载为 JSON 文件
 */
export const downloadAsJson = <T,>(
  data: T,
  filename: string,
  options: { space?: number; timestamp?: boolean } = {},
) => {
  const { space = 2, timestamp = false } = options;
  const jsonString = JSON.stringify(data, null, space);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const blobUrl = window.URL.createObjectURL(blob);

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

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${finalFilename}.json`;
  link.click();
  window.URL.revokeObjectURL(blobUrl);
};
