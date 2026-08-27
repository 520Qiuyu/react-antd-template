import type { AuthInfoListItem } from '@/types/authInfo';

/**
 * 生成模拟认证信息列表
 * @example
 * ```ts
 * const list = createMockAuthInfos();
 * ```
 */
export const createMockAuthInfos = (): AuthInfoListItem[] => {
  const now = Date.now();

  return [
    {
      id: 'auth-001',
      name: '主号认证',
      deviceId: 'device-main-01',
      cookie: 'sessionid=abc123; uid=10001',
      xHelios: 'helios-token-01',
      xMedusa: 'medusa-token-01',
      remark: '主力账号',
      ctime: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'auth-002',
      name: '备用认证',
      deviceId: 'device-backup-02',
      cookie: 'sessionid=def456; uid=10002',
      xHelios: 'helios-token-02',
      xMedusa: 'medusa-token-02',
      ctime: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      utime: new Date(now - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'auth-003',
      name: '测试认证',
      deviceId: 'device-test-03',
      cookie: 'sessionid=ghi789',
      xHelios: '',
      xMedusa: '',
      remark: '仅用于联调',
      ctime: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'auth-004',
      name: '池化认证 A',
      deviceId: 'device-pool-04',
      cookie: 'sessionid=jkl012; uid=10004',
      xHelios: 'helios-token-04',
      xMedusa: 'medusa-token-04',
      ctime: new Date().toISOString(),
      utime: new Date().toISOString(),
    },
  ];
};
