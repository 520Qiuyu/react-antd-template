import {
  reqDeleteCardSecret,
  reqGetCreateUserOptions,
  reqListCardSecrets,
  reqUpdateCardSecretStatus,
} from '@/apis/qishui/cardSecret';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { Status, STATUS_OPTIONS } from '@/constants';
import { getSearchFromObject, useCompRef, useGetList, useSearchParams } from '@/hooks';
import { useUser } from '@/hooks/useUser';
import type { CardSecretListItem, CardSecretListStats, CardSecretType } from '@/types/cardSecret';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Card, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import CardSecretFormModal from './components/CardSecretFormModal';
import CardSecretStat from './components/CardSecretStat';
import ExpireTimeCell from './components/ExpireTimeCell';
import ExportModal from './components/ExportModal';
import ParseUsageCell from './components/ParseUsageCell';
import {
  CARD_SECRET_TYPE_COLOR_MAP,
  CARD_SECRET_TYPE_OPTIONS,
  CARD_SECRET_TYPE_TEXT_MAP,
} from './constants';
import styles from './index.module.less';
import { copyCardSecretText } from './utils/copyCardSecretText';
import { maskCardSecretMiddle } from './utils/maskCardSecret';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};
const CardSecret: React.FC = () => {
  const navigate = useNavigate();
  const formModalRef = useCompRef(CardSecretFormModal);
  const { isAdmin, isSuperAdmin, userInfo } = useUser();
  const { searchParams, setSearchParams } = useSearchParams({
    ...defaultSearchParams,
    createUserId: isAdmin || isSuperAdmin ? userInfo?.id : undefined,
  });

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
      inputProps: { placeholder: '卡号 / ID / 备注' },
    },
    {
      name: 'type',
      label: '类型',
      type: 'select',
      options: CARD_SECRET_TYPE_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择类型',
      },
    },
    // 创建者
    isAdmin || isSuperAdmin
      ? {
          name: 'createUserId',
          label: '创建者',
          type: 'select',
          getOptionsApi: reqGetCreateUserOptions,
        }
      : undefined,
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: STATUS_OPTIONS,
    },
  ].filter(Boolean) as SearchFormOption[];

  /** 搜索 */
  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  /** 删除 */
  const handleDelete = async (record: CardSecretListItem) => {
    try {
      await confirm(`确定要删除卡密「${record.secret}」吗？`, '提示');
      const res = await reqDeleteCardSecret(record.id);
      if (res.code === 200) {
        msgSuccess('删除成功');
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  /** 复制卡密发货文本 */
  const handleCopyCardSecretText = (record: CardSecretListItem) => {
    copyCardSecretText(record);
  };

  /** 启用/禁用卡密 */
  const handleStatusChange = async (record: CardSecretListItem, checked: boolean) => {
    const nextStatus = checked ? Status.NORMAL : Status.DISABLED;
    const actionText = checked ? '启用' : '禁用';
    try {
      await confirm(`确定要${actionText}卡密「${record.secret}」吗？`, '提示');
      const res = await reqUpdateCardSecretStatus(record.id, { status: nextStatus });
      if (res.code === 200) {
        msgSuccess(`${actionText}成功`);
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  /** 跳转解析日志，按当前卡密筛选 */
  const handleGoParseLogs = (record: CardSecretListItem) => {
    const search = getSearchFromObject({
      pageNum: 1,
      pageSize: 10,
      keyword: record.secret,
    });
    navigate(`/qishui/logs?${search}`);
  };

  // 勾选
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<CardSecretListItem[]>([]);
  const rowSelection: TableProps<CardSecretListItem>['rowSelection'] = {
    preserveSelectedRowKeys: true,
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys as string[]);
      setSelectedRows(rows);
    },
  };

  // 批量导出
  const exportModalRef = useCompRef(ExportModal);
  /** 导出卡密 */
  const handleExportCardSecret = () => {
    if (!selectedRowKeys.length) {
      msgError('请先勾选要导出的卡密');
      return;
    }
    exportModalRef.current?.open({ selectedRows });
  };

  /** 列配置 */
  const columns: ColumnsType<CardSecretListItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 140,
      ellipsis: true,
      sorter: true,
      sortOrder: searchParams.sortField === 'id' ? searchParams.sortOrder : undefined,
      render: (val: string) => <span className={styles['idCell']}>{val}</span>,
    },
    {
      title: '卡号',
      dataIndex: 'secret',
      width: 220,
      fixed: 'left',
      sorter: true,
      sortOrder: searchParams.sortField === 'secret' ? searchParams.sortOrder : undefined,
      render: (val: string) => <CopyText text={val} showText={maskCardSecretMiddle(val)} />,
    },
    {
      title: '创建者',
      dataIndex: 'createUser',
      width: 120,
      render: (val: { account: string; nickname: string | null }) => (
        <span>{val?.nickname || val?.account}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      sorter: true,
      sortOrder: searchParams.sortField === 'type' ? searchParams.sortOrder : undefined,
      render: (type: CardSecretType) => (
        <Tag color={CARD_SECRET_TYPE_COLOR_MAP[type]}>{CARD_SECRET_TYPE_TEXT_MAP[type]}</Tag>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      width: 180,
      sorter: true,
      sortOrder: searchParams.sortField === 'expireTime' ? searchParams.sortOrder : undefined,
      render: (_, record) => <ExpireTimeCell record={record} />,
    },
    {
      title: '解析用量',
      key: 'parseCount',
      dataIndex: 'parsedCount',
      width: 160,
      sorter: true,
      sortOrder: searchParams.sortField === 'parsedCount' ? searchParams.sortOrder : undefined,
      render: (_, record) => (
        <ParseUsageCell record={record} onClick={() => handleGoParseLogs(record)} />
      ),
    },
    {
      title: '认证信息',
      key: 'auth',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        const auth = record.authInfo;
        if (!auth?.deviceId && !auth?.cookie) {
          return <span className={styles['cookieEmpty']}>未配置</span>;
        }
        return <CopyText text={auth.deviceId || auth.cookie || '已配置'} />;
      },
    },
    {
      title: '是否启用',
      dataIndex: 'status',
      width: 120,
      sorter: true,
      sortOrder: searchParams.sortField === 'status' ? searchParams.sortOrder : undefined,
      render: (_, record) => (
        <Switch
          checked={record.status === Status.NORMAL}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'ctime',
      width: 180,
      sorter: true,
      sortOrder: searchParams.sortField === 'ctime' ? searchParams.sortOrder : undefined,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'utime',
      width: 180,
      sorter: true,
      sortOrder: searchParams.sortField === 'utime' ? searchParams.sortOrder : undefined,
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
          {/* 复制卡密发货文本 */}
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<CopyOutlined />}
            toolTip='复制卡密发货文本'
            onClick={() => handleCopyCardSecretText(record)}
          />
          <MyButton
            size='small'
            variant='text'
            color='primary'
            permissionCode='qishui_card_secret_update'
            icon={<EditOutlined />}
            toolTip='编辑'
            onClick={() => formModalRef.current?.open(record)}
          />
          <MyButton
            type='text'
            size='small'
            danger
            permissionCode='qishui_card_secret_remove'
            icon={<DeleteOutlined />}
            toolTip='删除'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const { list, loading, total, otherInfo } = useGetList(reqListCardSecrets, usedSearchParams);
  const stats = otherInfo as Partial<CardSecretListStats>;

  return (
    <div className={styles['page']}>
      <CardSecretStat total={total} stats={stats} />

      <Card
        className={styles['listCard']}
        title='卡密列表'
        extra={
          <Space>
            <MyButton
              type='primary'
              permissionCode='qishui_card_secret_create'
              icon={<PlusOutlined />}
              onClick={() => formModalRef.current?.open()}>
              创建卡密
            </MyButton>
            <MyButton
              type='primary'
              icon={<ExportOutlined />}
              disabled={!selectedRowKeys.length}
              onClick={handleExportCardSecret}>
              导出卡密
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
          scroll={{ x: 1460 }}
          rowSelection={rowSelection}
          onChange={(_, __, sorter) => {
            const { field, order } = sorter as SorterResult<CardSecretListItem>;
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

      <CardSecretFormModal
        ref={formModalRef}
        onSuccess={() => setSearchParams({ ...searchParams })}
      />

      <ExportModal
        ref={exportModalRef}
        onSuccess={() => {
          setSelectedRowKeys([]);
          setSelectedRows([]);
        }}
      />
    </div>
  );
};

export default CardSecret;

interface SearchParams extends PaginationParams {
  keyword?: string;
  type?: CardSecretType | string;
  status?: string;
  createUserId?: string;
}
