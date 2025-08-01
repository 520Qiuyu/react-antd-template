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

/**
 * 将数据下载为JSON文件
 * @param data 要下载的数据
 * @param filename 文件名（不需要包含.json后缀）
 * @param options 配置选项
 * @example
 * // 基本使用
 * downloadAsJson({ name: 'test', age: 18 }, 'user-info');
 * 
 * // 自定义配置
 * downloadAsJson(data, 'data', { 
 *   space: 2, // 缩进空格数
 *   timestamp: true, // 添加时间戳到文件名
 *   replacer: (key, value) => value === null ? undefined : value // 自定义replacer
 * });
 */
export const downloadAsJson = (
  data: any,
  filename: string,
  options: {
    /** JSON.stringify的缩进空格数 */
    space?: number;
    /** 是否在文件名后添加时间戳 */
    timestamp?: boolean;
  } = {}
) => {
  try {
    // 处理选项
    const {
      space = 2,
      timestamp = false,
    } = options;

    // 转换数据为JSON字符串
    const jsonString = JSON.stringify(data, null, space);

    // 创建Blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    const blobUrl = window.URL.createObjectURL(blob);

    // 处理文件名
    let finalFilename = filename;
    if (timestamp) {
      const date = new Date();
      const timeString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
        date.getDate()
      ).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(
        date.getMinutes()
      ).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
      finalFilename = `${filename}_${timeString}`;
    }

    // 创建下载链接
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${finalFilename}.json`;
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);

    return true;
  } catch (error) {
    console.error('JSON数据下载失败:', error);
    return false;
  }
};