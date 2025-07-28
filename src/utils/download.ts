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
/**
 * 通过blob方式下载文件（适用于需要指定文件名的场景）
 * @param url 文件地址
 * @param name 文件名
 */
export const downloadWithFileName = async (url: string, name: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // 获取url的后缀
    const suffix = url.split('?')[0].split('.').pop();

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${name}.${suffix}`;
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('下载失败:', error);
  }
};

/**
 * 直接打开下载（适用于后端已经设置了文件名的场景）
 * @param url 文件地址
 */
export const downloadDirectly = (url: string) => {
  window.open(url, '_blank');
};

/**
 * 通过API下载（适用于需要带参数的场景）
 * @param url API地址
 * @param params 参数对象
 */
export const downloadByApi = (url: string, params: Record<string, any> = {}) => {
  // 去除params中的空值参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined),
  );
  // 将url和params对象拼接成完整的url
  const fullUrl = `${window.baseUrl}/${url}?${new URLSearchParams(
    filteredParams,
  ).toString()}`.replace(/[\/]+/g, '/');

  window.open(fullUrl, '_blank');
};

/**
 * 通过文件ID下载（适用于文档仓库场景）
 * @param fileId 文件ID
 * @param name 文件名
 */
export const downloadByFileId = async (fileId: string, name: string) => {
  const url = `api/docrepo/download?attachmentId=${fileId}`;
  await downloadWithFileName(url, name);
};
