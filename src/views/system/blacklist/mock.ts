import type { BlacklistListItem } from '@/types/blacklist';

/**
 * 生成模拟黑名单列表
 * @example
 * ```ts
 * const list = createMockBlacklist();
 * ```
 */
export const createMockBlacklist = (): BlacklistListItem[] => {
  const now = Date.now();

  return [
    {
      id: 'bl-001',
      ip: '203.0.113.88',
      source: 'manual',
      status: 'active',
      expireAt: null,
      reason: '恶意下单，退款',
      remark: '关联订单 ORD-20260728-001',
      createdBy: 'admin',
      ctime: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'bl-002',
      ip: '198.51.100.23',
      source: 'rate_limit',
      status: 'active',
      expireAt: new Date(now + 1000 * 60 * 60 * 12).toISOString(),
      reason: '请求频率过高，自动拉黑',
      remark: '触发限流阈值 120/min',
      createdBy: 'system',
      ctime: new Date(now - 1000 * 60 * 40).toISOString(),
      utime: new Date(now - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'bl-003',
      ip: '192.0.2.45',
      source: 'rate_limit',
      status: 'active',
      expireAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      reason: '请求频率过高，自动拉黑',
      createdBy: 'system',
      ctime: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: 'bl-004',
      ip: '203.0.113.15',
      source: 'manual',
      status: 'unblocked',
      expireAt: new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString(),
      reason: '疑似爬虫访问',
      remark: '误判已解除',
      createdBy: 'admin',
      ctime: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      utime: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      unblockedAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      unblockedBy: 'admin',
    },
  ];
};
