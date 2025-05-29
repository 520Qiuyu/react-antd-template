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
