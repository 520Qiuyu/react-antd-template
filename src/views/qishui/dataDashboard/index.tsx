import { reqGetDashboardOverview } from '@/apis/qishui/dashboard';
import { reqGetCreateUserOptions } from '@/apis/qishui/cardSecret';
import { useUser } from '@/hooks/useUser';
import type {
  DashboardCardRankItem,
  DashboardCreatorRankItem,
  DashboardMetricItem,
  DashboardOverview,
  DashboardRange,
} from '@/types/dashboard';
import { Area, Column, Pie } from '@ant-design/plots';
import { Card, Segmented, Select, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import classNames from 'classnames';
import { useMemo, useState } from 'react';
import { TIME_RANGE_OPTIONS } from './constants';
import styles from './index.module.less';

const SUCCESS_COLOR = '#389e0d';
const FAIL_COLOR = '#cf1322';
const STATUS_COLOR_MAP: Record<string, string> = {
  成功: SUCCESS_COLOR,
  失败: FAIL_COLOR,
};

const toneClassMap: Record<DashboardMetricItem['tone'], string> = {
  default: styles['toneDefault'],
  success: styles['toneSuccess'],
  warning: styles['toneWarning'],
  danger: styles['toneDanger'],
  primary: styles['tonePrimary'],
};

const EMPTY_OVERVIEW: DashboardOverview = {
  canViewAll: false,
  metrics: [],
  parseTrend: [],
  createTrend: [],
  creatorRank: [],
  hotCards: [],
  riskCards: [],
  typeDist: [],
  parseTypeDist: [],
  statusDist: [],
};

/**
 * 汽水数据看板
 * @example
 * ```tsx
 * <DataDashboard />
 * ```
 */
const DataDashboard: React.FC = () => {
  const { isAdmin, isSuperAdmin } = useUser();
  const canViewAll = isAdmin || isSuperAdmin;
  const [timeRange, setTimeRange] = useState<DashboardRange>('7d');
  const [creatorId, setCreatorId] = useState<string>();

  const { data: overviewRes, loading } = useRequest(
    () =>
      reqGetDashboardOverview({
        range: timeRange,
        creatorId: canViewAll ? creatorId : undefined,
      }),
    {
      refreshDeps: [timeRange, creatorId, canViewAll],
    },
  );

  const { data: creatorOptionsRes } = useRequest(
    () => reqGetCreateUserOptions(),
    {
      ready: canViewAll,
    },
  );

  const data = overviewRes?.data ?? EMPTY_OVERVIEW;

  const creatorOptions = useMemo(() => {
    const list = creatorOptionsRes?.data ?? [];
    return [
      { label: '全部创建者', value: '' },
      ...list.map((item) => ({
        label: item.nickname ? `${item.label}（${item.nickname}）` : item.label,
        value: item.value,
      })),
    ];
  }, [creatorOptionsRes]);

  const metrics = data.metrics;

  const parseTrendTotals = useMemo(() => {
    return data.parseTrend.reduce(
      (acc, item) => {
        acc.total += item.value;
        if (item.category === '成功') acc.success += item.value;
        if (item.category === '失败') acc.fail += item.value;
        return acc;
      },
      { total: 0, success: 0, fail: 0 },
    );
  }, [data.parseTrend]);

  const createTrendTotal = useMemo(
    () => data.createTrend.reduce((sum, item) => sum + item.value, 0),
    [data.createTrend],
  );

  const creatorColumns: ColumnsType<DashboardCreatorRankItem> = [
    {
      title: '创建者',
      dataIndex: 'account',
      width: 140,
      render: (account: string, record) => (
        <div>
          <div>{account}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>{record.nickname}</div>
        </div>
      ),
    },
    {
      title: '发卡总数',
      dataIndex: 'totalCards',
      width: 96,
      sorter: (a, b) => a.totalCards - b.totalCards,
    },
    {
      title: '本期新增',
      dataIndex: 'periodCreated',
      width: 96,
      sorter: (a, b) => a.periodCreated - b.periodCreated,
    },
    { title: '启用中', dataIndex: 'enabledCount', width: 88 },
    {
      title: '时长/次数',
      key: 'typeSplit',
      width: 110,
      render: (_, record) => `${record.timeTypeCount} / ${record.countTypeCount}`,
    },
    {
      title: '本期解析',
      dataIndex: 'periodParse',
      width: 100,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.periodParse - b.periodParse,
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      width: 90,
      render: (val: number) => (
        <span style={{ color: val >= 90 ? SUCCESS_COLOR : val < 85 ? FAIL_COLOR : undefined }}>
          {val}%
        </span>
      ),
    },
    { title: '活跃卡密', dataIndex: 'activeCards', width: 96 },
    { title: '最后解析', dataIndex: 'lastParseTime', width: 170 },
  ];

  const cardColumns: ColumnsType<DashboardCardRankItem> = [
    {
      title: '卡号',
      dataIndex: 'secret',
      width: 130,
      render: (val: string) => <span className={styles['secretCell']}>{val}</span>,
    },
    { title: '创建者', dataIndex: 'creator', width: 110 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type: DashboardCardRankItem['type']) => (
        <Tag color={type === 'time' ? 'blue' : 'purple'}>{type === 'time' ? '时长' : '次数'}</Tag>
      ),
    },
    {
      title: '本期解析',
      dataIndex: 'periodParse',
      width: 96,
      sorter: (a, b) => a.periodParse - b.periodParse,
    },
    { title: '余量', dataIndex: 'remainText', width: 110 },
    {
      title: '成功率',
      dataIndex: 'successRate',
      width: 88,
      render: (val: number) =>
        val ? (
          <span style={{ color: val >= 90 ? SUCCESS_COLOR : val < 85 ? FAIL_COLOR : undefined }}>
            {val}%
          </span>
        ) : (
          '-'
        ),
    },
  ];

  const riskColumns: ColumnsType<DashboardCardRankItem> = [
    ...cardColumns,
    {
      title: '风险',
      dataIndex: 'risk',
      width: 100,
      render: (val?: string) =>
        val ? (
          <Tag color='orange' className={styles['riskTag']}>
            {val}
          </Tag>
        ) : (
          '-'
        ),
    },
  ];

  const parseTrendConfig = {
    data: data.parseTrend,
    xField: 'date',
    yField: 'value',
    colorField: 'category',
    legend: { position: 'top' as const },
    axis: {
      y: { grid: true, title: false },
      x: { title: false },
    },
    scale: {
      color: {
        domain: ['成功', '失败'],
        range: [SUCCESS_COLOR, FAIL_COLOR],
      },
    },
    style: {
      fillOpacity: 0.18,
      shape: 'smooth',
    },
    height: 280,
    autoFit: true,
  };

  const createTrendConfig = {
    data: data.createTrend,
    xField: 'date',
    yField: 'value',
    legend: false,
    axis: {
      y: { grid: true, title: false },
      x: { title: false },
    },
    style: { radiusTopLeft: 4, radiusTopRight: 4 },
    height: 280,
    autoFit: true,
  };

  const buildPieConfig = (
    pieData: { type: string; value: number }[],
    colorMap?: Record<string, string>,
  ) => ({
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    legend: { position: 'bottom' as const },
    innerRadius: 0.62,
    label: {
      text: 'type',
      position: 'outside' as const,
    },
    ...(colorMap
      ? {
          scale: {
            color: {
              domain: Object.keys(colorMap),
              range: Object.values(colorMap),
            },
          },
        }
      : {}),
    height: 220,
    autoFit: true,
  });

  return (
    <div className={styles['page']}>
      <div className={styles['hero']}>
        <div className={styles['heroText']}>
          <h1 className={styles['heroTitle']}>数据看板</h1>
          <p className={styles['heroDesc']}>
            查看卡密创建、解析消耗与各时间段趋势。切换筛选后会重新聚合统计。
          </p>
        </div>
        <div className={styles['filters']}>
          <Segmented
            value={timeRange}
            options={TIME_RANGE_OPTIONS}
            onChange={(val) => setTimeRange(val as DashboardRange)}
          />
          {canViewAll ? (
            <Select
              allowClear
              style={{ width: 200 }}
              value={creatorId}
              options={creatorOptions}
              placeholder='全部创建者'
              onChange={(val) => setCreatorId(val || undefined)}
              aria-label='按创建者筛选'
            />
          ) : null}
        </div>
      </div>

      <Spin spinning={loading}>
        <div className={styles['dashboardBody']}>
          <div
            className={styles['metricGrid']}
            style={
              metrics.some((item) => item.key === 'creators')
                ? undefined
                : { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }
            }>
            {metrics.map((item) => (
              <div key={item.key} className={styles['metricCard']}>
                <span className={styles['metricLabel']}>{item.label}</span>
                <span className={styles['metricValue']}>{item.value.toLocaleString()}</span>
                <span className={classNames(styles['metricDesc'], toneClassMap[item.tone])}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>

          <div className={styles['chartRow']}>
            <Card
              className={styles['panel']}
              title='解析量趋势'
              extra={
                <span className={styles['chartExtra']}>
                  <span className={classNames(styles['chartExtraItem'], styles['chartExtraTotal'])}>
                    总数 <em>{parseTrendTotals.total.toLocaleString()}</em>
                  </span>
                  <span
                    className={classNames(styles['chartExtraItem'], styles['chartExtraSuccess'])}>
                    成功 <em>{parseTrendTotals.success.toLocaleString()}</em>
                  </span>
                  <span className={classNames(styles['chartExtraItem'], styles['chartExtraFail'])}>
                    失败 <em>{parseTrendTotals.fail.toLocaleString()}</em>
                  </span>
                </span>
              }>
              <div className={styles['chartBox']}>
                <Area {...parseTrendConfig} />
              </div>
            </Card>
            <Card
              className={styles['panel']}
              title='发卡量趋势'
              extra={
                <span className={styles['chartExtra']}>
                  <span className={classNames(styles['chartExtraItem'], styles['chartExtraTotal'])}>
                    总数 <em>{createTrendTotal.toLocaleString()}</em>
                  </span>
                </span>
              }>
              <div className={styles['chartBox']}>
                <Column {...createTrendConfig} />
              </div>
            </Card>
          </div>

          <Card
            className={styles['panel']}
            title={canViewAll ? '创建者排行' : '我的发卡与解析'}
            extra={<span>按本期解析排序</span>}>
            <Table
              rowKey='id'
              size='middle'
              pagination={false}
              columns={creatorColumns}
              dataSource={data.creatorRank}
              scroll={{ x: 1100 }}
            />
          </Card>

          <div className={styles['rankRow']}>
            <Card className={styles['panel']} title='高消耗卡密 Top' extra={<span>本期</span>}>
              <Table
                rowKey='id'
                size='small'
                pagination={false}
                columns={cardColumns}
                dataSource={data.hotCards}
                scroll={{ x: 640 }}
              />
            </Card>
            <Card className={styles['panel']} title='风险卡密 Top' extra={<span>需关注</span>}>
              <Table
                rowKey='id'
                size='small'
                pagination={false}
                columns={riskColumns}
                dataSource={data.riskCards}
                scroll={{ x: 720 }}
              />
            </Card>
          </div>

          <div className={styles['distRow']}>
            <Card className={styles['panel']} title='卡密类型分布'>
              <div className={styles['chartBoxSm']}>
                <Pie {...buildPieConfig(data.typeDist)} />
              </div>
            </Card>
            <Card className={styles['panel']} title='解析类型分布'>
              <div className={styles['chartBoxSm']}>
                <Pie {...buildPieConfig(data.parseTypeDist)} />
              </div>
            </Card>
            <Card className={styles['panel']} title='解析状态分布'>
              <div className={styles['chartBoxSm']}>
                <Pie {...buildPieConfig(data.statusDist, STATUS_COLOR_MAP)} />
              </div>
            </Card>
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default DataDashboard;
