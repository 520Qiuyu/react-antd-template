import { reqDeleteParseLog, reqListParseLogs } from '@/apis/qishui/parseLog';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import type {
  ParseLogListItem,
  ParseLogListStats,
  ParseLogStatus,
  ParseLogType,
} from '@/types/parseLog';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Card, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { maskCardSecretMiddle } from '../cardSecret/utils/maskCardSecret';
import ParseLogDetailModal from './components/ParseLogDetailModal';
import ParseLogStat from './components/ParseLogStat';
import {
  PARSE_LOG_STATUS_COLOR_MAP,
  PARSE_LOG_STATUS_OPTIONS,
  PARSE_LOG_STATUS_TEXT_MAP,
  PARSE_LOG_TYPE_COLOR_MAP,
  PARSE_LOG_TYPE_OPTIONS,
  PARSE_LOG_TYPE_TEXT_MAP,
} from './constants';
import styles from './index.module.less';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

/**
 * 解析日志管理
 */
const ParseLogs: React.FC = () => {
  const detailModalRef = useCompRef(ParseLogDetailModal);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  const usedSearchParams = useMemo(() => {
    const { sortOrder, ...rest } = searchParams;
    return {
      ...rest,
      sortOrder: sortOrder === 'ascend' ? 'asc' : 'desc',
    };
  }, [searchParams]);

  const searchFormOptions: SearchFormOption[] = [
    {
      name: 'keyword',
      label: '关键词',
      inputProps: { placeholder: '卡密 / 目标名称 / IP / 账号' },
    },
    {
      name: 'type',
      label: '类型',
      type: 'select',
      options: PARSE_LOG_TYPE_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择类型',
      },
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: PARSE_LOG_STATUS_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择状态',
      },
    },
  ];

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: ParseLogListItem) => {
    try {
      await confirm(`确定要删除日志「${record.targetName || record.id}」吗？`, '提示');
      const res = await reqDeleteParseLog(record.id);
      if (res.code === 200) {
        msgSuccess('删除成功');
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleViewDetail = (record: ParseLogListItem) => {
    detailModalRef.current?.open(record);
  };

  const columns: ColumnsType<ParseLogListItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      ellipsis: true,
      sorter: true,
      sortOrder: searchParams.sortField === 'id' ? searchParams.sortOrder : undefined,
      render: (val: string) => <span className={styles['idCell']}>{val}</span>,
    },
    {
      title: '卡密',
      dataIndex: 'cardSecret',
      width: 200,
      fixed: 'left',
      sorter: true,
      sortOrder: searchParams.sortField === 'cardSecret' ? searchParams.sortOrder : undefined,
      render: (val?: string | null) =>
        val ? (
          <CopyText text={val} showText={maskCardSecretMiddle(val)} />
        ) : (
          <span className={styles['emptyText']}>-</span>
        ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      sorter: true,
      sortOrder: searchParams.sortField === 'type' ? searchParams.sortOrder : undefined,
      render: (type: ParseLogType) => (
        <Tag color={PARSE_LOG_TYPE_COLOR_MAP[type]}>{PARSE_LOG_TYPE_TEXT_MAP[type]}</Tag>
      ),
    },
    {
      title: '目标',
      dataIndex: 'targetName',
      width: 180,
      ellipsis: true,
      sorter: true,
      sortOrder: searchParams.sortField === 'targetName' ? searchParams.sortOrder : undefined,
      render: (val: string, record) => (
        <Tooltip title={record.targetId}>
          <span>{val || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '解析参数',
      dataIndex: 'parseParams',
      width: 220,
      ellipsis: true,
      render: (val?: string | null) =>
        val ? <CopyText text={val} /> : <span className={styles['emptyText']}>-</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      sorter: true,
      sortOrder: searchParams.sortField === 'status' ? searchParams.sortOrder : undefined,
      render: (status: ParseLogStatus) => (
        <Tag color={PARSE_LOG_STATUS_COLOR_MAP[status]}>{PARSE_LOG_STATUS_TEXT_MAP[status]}</Tag>
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'errorMsg',
      width: 180,
      ellipsis: true,
      render: (val?: string | null) =>
        val ? (
          <span className={styles['errorMsg']}>{val}</span>
        ) : (
          <span className={styles['emptyText']}>-</span>
        ),
    },
    {
      title: '账号',
      dataIndex: 'userAccount',
      width: 120,
      render: (val?: string | null) => val || <span className={styles['emptyText']}>游客</span>,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      sorter: true,
      sortOrder: searchParams.sortField === 'ip' ? searchParams.sortOrder : undefined,
    },
    {
      title: 'UA',
      dataIndex: 'ua',
      width: 220,
      ellipsis: { showTitle: false },
      render: (val?: string | null) =>
        val ? (
          <Tooltip title={val}>
            <span>
              <CopyText text={val} />
            </span>
          </Tooltip>
        ) : (
          <span className={styles['emptyText']}>-</span>
        ),
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      width: 100,
      sorter: true,
      sortOrder: searchParams.sortField === 'durationMs' ? searchParams.sortOrder : undefined,
      render: (val: number) => <span className={styles['duration']}>{val}ms</span>,
    },
    {
      title: '解析时间',
      dataIndex: 'ctime',
      width: 180,
      sorter: true,
      sortOrder: searchParams.sortField === 'ctime' ? searchParams.sortOrder : undefined,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space align='center' size={4}>
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<EyeOutlined />}
            toolTip='查看详情'
            onClick={() => handleViewDetail(record)}
          />
          <MyButton
            type='text'
            size='small'
            danger
            permissionCode='qishui_logs_remove'
            icon={<DeleteOutlined />}
            toolTip='删除'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];
  const { list, loading, total, otherInfo } = useGetList(reqListParseLogs, usedSearchParams);
  const stats = otherInfo as Partial<ParseLogListStats>;

  return (
    <div className={styles['page']}>
      <ParseLogStat total={total} stats={stats} />

      <Card className={styles['listCard']} title='解析日志'>
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
          scroll={{ x: 2000 }}
          onChange={(_, __, sorter) => {
            const { field, order } = sorter as SorterResult<ParseLogListItem>;
            setSearchParams({
              ...searchParams,
              sortField: field as string,
              sortOrder: order as SortOrder,
            });
          }}
        />
        <MyPagination
          current={searchParams.pageNum}
          pageSize={searchParams.pageSize}
          total={total}
          onChange={(pageNum, pageSize) => setSearchParams({ ...searchParams, pageNum, pageSize })}
        />
      </Card>

      <ParseLogDetailModal ref={detailModalRef} />
    </div>
  );
};

export default ParseLogs;

interface SearchParams extends PaginationParams {
  keyword?: string;
  type?: ParseLogType | string;
  status?: ParseLogStatus | string;
}
