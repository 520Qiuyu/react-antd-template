import type { CardSecretListItem } from '@/types/cardSecret';

/**
 * 生成模拟卡密列表数据
 * @example
 * ```ts
 * const list = createMockCardSecrets();
 * ```
 */
export const createMockCardSecrets = (): CardSecretListItem[] => {
  const now = Date.now();

  return [
    {
      id: 'cs-001',
      cardNo: 'QS-2026-A1B2C3D4',
      type: 'time',
      expireTime: '2026-12-31T23:59:59',
      parsedCount: 12,
      unparsedCount: 0,
      deviceId: 'device-main-01',
      cookie: 'session=abc123',
      xHelios: 'helios-token-01',
      xMedusa: 'medusa-token-01',
      ctime: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'cs-002',
      cardNo: 'QS-2026-E5F6G7H8',
      type: 'count',
      expireTime: null,
      parsedCount: 3,
      unparsedCount: 7,
      deviceId: 'device-backup-02',
      cookie: 'session=def456',
      xHelios: null,
      xMedusa: null,
      ctime: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      utime: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'cs-003',
      cardNo: 'QS-2026-I9J0K1L2',
      type: 'time',
      expireTime: '2026-08-15T12:00:00',
      parsedCount: 0,
      unparsedCount: 0,
      deviceId: null,
      cookie: null,
      xHelios: null,
      xMedusa: null,
      ctime: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'cs-004',
      cardNo: 'QS-2026-M3N4O5P6',
      type: 'count',
      expireTime: null,
      parsedCount: 28,
      unparsedCount: 72,
      deviceId: 'device-pool-03',
      cookie: 'session=ghi789',
      xHelios: 'helios-token-03',
      xMedusa: 'medusa-token-03',
      ctime: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      utime: new Date(now - 1000 * 60 * 10).toISOString(),
    },
  ];
};
