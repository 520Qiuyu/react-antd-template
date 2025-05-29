/** 检查文件大小 */
export function checkFileSize(file: File, maxSize: number, unit = 1000 * 1000) {
  if (file.size > maxSize * unit) {
    return false;
  }
  return true;
}

/** 检查文件类型 */
export function checkFileType(file: File, accept: string | string[]) {
  // 检查文件类型
  const fileType = file.name.split('.').slice(-1)[0];
  if (!accept.includes(fileType)) {
    return false;
  }
  return true;
}
