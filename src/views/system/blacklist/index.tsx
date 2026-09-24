import {
  reqCreateIpBlacklist,
  reqGetIpBlacklistEnabled,
  reqListIpBlacklist,
  reqUnblockIpBlacklist,
  reqSetIpBlacklistRecordEnabled,
  reqUpdateIpBlacklist,
  reqUpdateIpBlacklistEnabled,
} from '@/apis';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import type {
  BlacklistFormValues,
  BlacklistListItem,
  BlacklistSource,
  BlacklistStatus,
} from '@/types/blacklist';
import { confirm, msgSuccess, msgWarning } from '@/utils/modal';
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
} from './constants';
import styles from './index.module.less';
import { getExpireStatus, resolveExpireAt } from './utils';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
  // status: 'active',
};

/**
 * 黑名单管理
 */
const BlacklistManagement: React.FC = () => {
  const formModalRef = useCompRef(BlacklistFormModal);
  const [enabled, setEnabled] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  const usedSearchParams = useMemo(() => {
    const { dateRange, source, status, keyword, ...rest } = searchParams;
    const [startTime, endTime] = Array.isArray(dateRange) ? dateRange : [];
    return {
      ...rest,
      ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
      ...(source ? { source } : {}),
      ...(status ? { status } : {}),
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    };
  }, [searchParams]);

  const { list, loading, total, otherInfo } = useGetList<BlacklistListItem>(
    reqListIpBlacklist,
    usedSearchParams,
  );
  const stats = otherInfo as {
    activeCount?: number;
    pageManualCount?: number;
    pageAutoCount?: number;
  };

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

  useEffect(() => {
    const loadEnabled = async () => {
      const res = await reqGetIpBlacklistEnabled();
      if (res.code === 200 && res.data) {
        setEnabled(res.data.enabled);
      }
    };
    void loadEnabled();
  }, []);

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleToggleEnabled = async (checked: boolean) => {
    const previous = enabled;
    setEnabled(checked);
    setSwitchLoading(true);
    try {
      const res = await reqUpdateIpBlacklistEnabled(checked);
      if (res.code !== 200) {
        setEnabled(previous);
        return;
      }
      if (checked) {
        msgSuccess('已开启黑名单拦截');
        return;
      }
      msgWarning('已关闭黑名单拦截，拉黑记录仍保留但不拦截');
    } catch (error) {
      setEnabled(previous);
      console.log('error', error);
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleToggleRecordEnabled = async (record: BlacklistListItem, checked: boolean) => {
    try {
      const res = await reqSetIpBlacklistRecordEnabled(record.id, checked);
      if (res.code !== 200) return;
      msgSuccess(checked ? '已启用该规则' : '已暂时停用，记录保留但不再拦截');
      setSearchParams({ ...searchParams });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleUnblock = async (record: BlacklistListItem) => {
    try {
      await confirm(`确定解除拉黑「${record.ip}」吗？`, '提示');
      const res = await reqUnblockIpBlacklist(record.id);
      if (res.code !== 200) return;
      msgSuccess('已解除拉黑');
      setSearchParams({ ...searchParams });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleFormSuccess = async (values: BlacklistFormValues, record?: BlacklistListItem) => {
    const payload = {
      ip: values.ip,
      expireAt: resolveExpireAt(values.duration, values.customExpireAt),
      reason: values.reason,
      ...(record
        ? { remark: values.remark || null }
        : values.remark
          ? { remark: values.remark }
          : {}),
    };
    const res = record
      ? await reqUpdateIpBlacklist(record.id, payload)
      : await reqCreateIpBlacklist(payload);
    if (res.code !== 200) {
      throw new Error(res.message || '保存失败');
    }
    setSearchParams({
      ...searchParams,
      ...(record ? {} : { status: 'active', pageNum: 1 }),
    });
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
    // 是否启用
    {
      title: '是否启用',
      dataIndex: 'status',
      width: 100,
      render: (status: BlacklistStatus, record) => (
        <Switch
          checked={status === 'active'}
          disabled={status === 'unblocked'}
          checkedChildren='启用'
          unCheckedChildren='停用'
          onChange={(checked) => handleToggleRecordEnabled(record, checked)}
        />
      ),
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
          支持手动添加、编辑和解除拉黑；限流自动拉黑记录只展示，不可在此新增
        </p>
      </div>

      <BlacklistStat
        totalActive={stats.activeCount ?? 0}
        pageManualCount={stats.pageManualCount ?? 0}
        pageAutoCount={stats.pageAutoCount ?? 0}
      />

      <Card
        className={styles['listCard']}
        title='黑名单列表'
        extra={
          <Space size={16}>
            <div className={styles['switchWrap']}>
              <span className={styles['switchLabel']}>黑名单拦截</span>
              <Switch
                checked={enabled}
                loading={switchLoading}
                checkedChildren='开启'
                unCheckedChildren='关闭'
                onChange={handleToggleEnabled}
              />
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
          dataSource={list}
          loading={loading}
          pagination={false}
          scroll={{ x: 1680 }}
        />
        <MyPagination
          current={searchParams.pageNum}
          pageSize={searchParams.pageSize}
          total={total}
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
