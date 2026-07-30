import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { useCompRef, useSearchParams, useUser } from '@/hooks';
import type {
  BlacklistFormValues,
  BlacklistListItem,
  BlacklistSource,
  BlacklistStatus,
} from '@/types/blacklist';
import { confirm, msgError, msgSuccess, msgWarning } from '@/utils/modal';
import { PlusOutlined } from '@ant-design/icons';
import { Card, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import BlacklistFormModal from './components/BlacklistFormModal';
import BlacklistStat from './components/BlacklistStat';
import {
  BLACKLIST_SOURCE_COLOR_MAP,
  BLACKLIST_SOURCE_OPTIONS,
  BLACKLIST_SOURCE_TEXT_MAP,
  BLACKLIST_STATUS_OPTIONS,
  IP_BLACKLIST_ENABLED_KEY,
} from './constants';
import styles from './index.module.less';
import { createMockBlacklist } from './mock';
import { filterBlacklistList, getExpireStatus, resolveExpireAt } from './utils';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
  status: 'active',
};

/**
 * 读取拦截开关初始值
 * @example
 * ```ts
 * readEnabledFlag() // true
 * ```
 */
const readEnabledFlag = () => {
  const raw = localStorage.getItem(IP_BLACKLIST_ENABLED_KEY);
  if (raw === null) return true;
  return raw === 'true';
};

/**
 * 黑名单管理
 */
const BlacklistManagement: React.FC = () => {
  const formModalRef = useCompRef(BlacklistFormModal);
  const { userInfo } = useUser();
  const [dataSource, setDataSource] = useState<BlacklistListItem[]>(() => createMockBlacklist());
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(readEnabledFlag);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  const filteredList = useMemo(
    () =>
      filterBlacklistList(dataSource, {
        keyword: searchParams.keyword,
        source: searchParams.source,
        status: searchParams.status,
        dateRange: searchParams.dateRange as [string, string] | null | undefined,
      }),
    [dataSource, searchParams],
  );

  const pagedList = useMemo(() => {
    const start = (searchParams.pageNum - 1) * searchParams.pageSize;
    return filteredList.slice(start, start + searchParams.pageSize);
  }, [filteredList, searchParams.pageNum, searchParams.pageSize]);

  const totalActive = useMemo(
    () => dataSource.filter((item) => item.status === 'active').length,
    [dataSource],
  );
  const pageManualCount = useMemo(
    () => pagedList.filter((item) => item.source === 'manual').length,
    [pagedList],
  );
  const pageAutoCount = useMemo(
    () => pagedList.filter((item) => item.source === 'rate_limit').length,
    [pagedList],
  );

  const searchFormOptions: SearchFormOption[] = [
    {
      name: 'keyword',
      label: '关键词',
      inputProps: { placeholder: 'IP / 原因 / 备注' },
    },
    {
      name: 'source',
      label: '来源',
      type: 'select',
      options: BLACKLIST_SOURCE_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择来源',
      },
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: BLACKLIST_STATUS_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择状态',
      },
    },
    {
      name: 'dateRange',
      label: '创建时间',
      type: 'rangePicker',
      inputProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ];

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleToggleEnabled = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem(IP_BLACKLIST_ENABLED_KEY, String(checked));
    if (checked) {
      msgSuccess('已开启黑名单拦截');
      return;
    }
    msgWarning('已关闭黑名单拦截，拉黑记录仍保留但不拦截');
  };

  const handleUnblock = async (record: BlacklistListItem) => {
    try {
      await confirm(`确定解除拉黑「${record.ip}」吗？`, '提示');
      setLoading(true);
      const now = new Date().toISOString();
      const operator = userInfo?.account || 'admin';
      setDataSource((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                status: 'unblocked',
                unblockedAt: now,
                unblockedBy: operator,
                utime: now,
              }
            : item,
        ),
      );
      msgSuccess('已解除拉黑');
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = async (values: BlacklistFormValues, record?: BlacklistListItem) => {
    const now = new Date().toISOString();
    const operator = userInfo?.account || 'admin';
    const expireAt = resolveExpireAt(values.duration, values.customExpireAt);

    const duplicated = dataSource.some(
      (item) =>
        item.status === 'active' &&
        item.ip === values.ip &&
        item.id !== record?.id,
    );
    if (duplicated) {
      msgError('该 IP 已在黑名单中');
      throw new Error('duplicate ip');
    }

    if (record) {
      setDataSource((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                ip: values.ip,
                expireAt,
                reason: values.reason,
                remark: values.remark,
                utime: now,
              }
            : item,
        ),
      );
      return;
    }

    const newItem: BlacklistListItem = {
      id: `bl-${Date.now()}`,
      ip: values.ip,
      source: 'manual',
      status: 'active',
      expireAt,
      reason: values.reason,
      remark: values.remark,
      createdBy: operator,
      ctime: now,
      utime: now,
    };
    setDataSource((prev) => [newItem, ...prev]);
    setSearchParams({ ...searchParams, status: 'active', pageNum: 1 });
  };

  const columns: ColumnsType<BlacklistListItem> = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      width: 160,
      fixed: 'left',
      render: (val: string) => <CopyText text={val} />,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 110,
      render: (source: BlacklistSource) => (
        <Tag color={BLACKLIST_SOURCE_COLOR_MAP[source]}>{BLACKLIST_SOURCE_TEXT_MAP[source]}</Tag>
      ),
    },
    {
      title: '是否过期',
      key: 'expireStatus',
      width: 100,
      render: (_, record) => {
        const status = getExpireStatus(record.expireAt);
        if (status === 'permanent') return <Tag color='magenta'>永久</Tag>;
        if (status === 'expired') return <Tag>已过期</Tag>;
        return <Tag color='green'>未过期</Tag>;
      },
    },
    {
      title: '拉黑时长 / 过期时间',
      dataIndex: 'expireAt',
      width: 180,
      render: (val: string | null) =>
        val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : <Tag color='magenta'>永久</Tag>,
    },
    {
      title: '拉黑原因',
      dataIndex: 'reason',
      width: 200,
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      ellipsis: true,
      render: (val?: string) => val || <span className={styles['emptyText']}>-</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'ctime',
      width: 180,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'utime',
      width: 180,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        if (record.status === 'unblocked') {
          return <span className={styles['emptyText']}>已解除</span>;
        }
        return (
          <Space align='center' size={4}>
            <MyButton
              size='small'
              variant='text'
              color='primary'
              onClick={() => formModalRef.current?.open(record)}>
              编辑
            </MyButton>
            <MyButton type='text' size='small' danger onClick={() => handleUnblock(record)}>
              解除拉黑
            </MyButton>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles['page']}>
      <div className={styles['pageHeader']}>
        <h1 className={styles['pageTitle']}>黑名单管理</h1>
        <p className={styles['pageDesc']}>
          支持手动 / 自动拉黑恶意 IP；变更同步至 Redis，实时生效（一期为前端预览）
        </p>
      </div>

      <BlacklistStat
        totalActive={totalActive}
        pageManualCount={pageManualCount}
        pageAutoCount={pageAutoCount}
      />

      <Card
        className={styles['listCard']}
        title='黑名单列表'
        extra={
          <Space size={16}>
            <div className={styles['switchWrap']}>
              <span className={styles['switchLabel']}>黑名单拦截</span>
              <Switch checked={enabled} checkedChildren='开启' unCheckedChildren='关闭' onChange={handleToggleEnabled} />
            </div>
            <MyButton
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => formModalRef.current?.open()}>
              添加黑名单
            </MyButton>
          </Space>
        }>
        <div className={styles['toolbar']}>
          <SearchForm
            searchParams={searchParams}
            loading={loading}
            onSearch={handleSearch}
            options={searchFormOptions}
          />
        </div>
        <Table
          rowKey='id'
          columns={columns}
          dataSource={pagedList}
          loading={loading}
          pagination={false}
          scroll={{ x: 1680 }}
        />
        <MyPagination
          current={searchParams.pageNum}
          pageSize={searchParams.pageSize}
          total={filteredList.length}
          onChange={(pageNum, pageSize) => setSearchParams({ ...searchParams, pageNum, pageSize })}
        />
      </Card>

      <BlacklistFormModal ref={formModalRef} onSuccess={handleFormSuccess} />
    </div>
  );
};

export default BlacklistManagement;

interface SearchParams extends PaginationParams {
  keyword?: string;
  source?: BlacklistSource | string;
  status?: BlacklistStatus | string;
  dateRange?: [string, string] | string[] | null;
}
