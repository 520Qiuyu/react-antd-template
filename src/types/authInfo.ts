/** 认证信息列表项 */
export interface AuthInfoListItem {
  id: string;
  /** 名称 */
  name: string;
  /** 设备 ID */
  deviceId: string;
  /** Cookie */
  cookie: string;
  /** X-Helios */
  xHelios: string;
  /** X-Medusa */
  xMedusa: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  ctime: string;
  /** 更新时间 */
  utime: string;
}

/** 新建 / 编辑表单参数 */
export interface AuthInfoFormValues {
  name: string;
  deviceId: string;
  cookie: string;
  xHelios: string;
  xMedusa: string;
  remark?: string;
}
