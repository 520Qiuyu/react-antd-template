import {
  reqDeleteAuthInfo,
  reqListAuthInfos,
  reqUpdateAuthInfoStatus,
} from '@/apis/authManagement';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { Status, STATUS_OPTIONS } from '@/constants';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import type {
  AuthInfoCompleteStatus,
  AuthInfoListItem,
  AuthInfoListStats,
  AuthPlatform,
} from '@/types/authInfo';
import { confirm, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import AuthInfoFormModal from './components/AuthInfoFormModal';
import AuthInfoStat from './components/AuthInfoStat';
import {
  AUTH_COMPLETE_OPTIONS,
  AUTH_PLATFORM_COLOR_MAP,
  AUTH_PLATFORM_OPTIONS,
  AUTH_PLATFORM_TEXT_MAP,
} from './constants';
import styles from './index.module.less';
import { isAuthInfoComplete, stringifyAuthInfoJson } from './utils';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

/**
 * 认证信息管理
 */
const AuthInfo: React.FC = () => {
  const formModalRef = useCompRef(AuthInfoFormModal);
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
      inputProps: { placeholder: '名称 / ID / 备注' },
    },
    {
      name: 'platform',
      label: '平台',
      type: 'select',
      options: AUTH_PLATFORM_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择平台',
      },
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: STATUS_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择状态',
      },
    },
    {
      name: 'completeStatus',
      label: '完整性',
      type: 'select',
      options: AUTH_COMPLETE_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择完整性',
      },
    },
  ];

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: AuthInfoListItem) => {
    try {
      await confirm(`确定要删除认证信息「${record.name || record.id}」吗？`, '提示');
      const res = await reqDeleteAuthInfo(record.id);
      if (res.code === 200) {
        msgSuccess('删除成功');
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleStatusChange = async (record: AuthInfoListItem, checked: boolean) => {
    const nextStatus = checked ? Status.NORMAL : Status.DISABLED;
    const actionText = checked ? '启用' : '禁用';
    try {
      await confirm(`确定要${actionText}认证信息「${record.name || record.id}」吗？`, '提示');
      const res = await reqUpdateAuthInfoStatus(record.id, { status: nextStatus });
      if (res.code === 200) {
        msgSuccess(`${actionText}成功`);
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const renderOptionalText = (val?: string) =>
    val ? <CopyText text={val} /> : <span className={styles['emptyText']}>-</span>;

  const renderAuthInfoJson = (payload?: AuthInfoListItem['authInfo']) => {
    const prettyText = stringifyAuthInfoJson(payload, ['name']);
    const compactText = prettyText.replace(/\s+/g, ' ').trim();
    if (compactText === '{}') {
      return <span className={styles['emptyText']}>-</span>;
    }
    return <CopyText className={styles['jsonCell']} text={prettyText} showText={compactText} />;
  };

  const columns: ColumnsType<AuthInfoListItem> = [
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
      title: '名称',
      dataIndex: 'name',
      width: 160,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 120,
      sorter: true,
      sortOrder: searchParams.sortField === 'platform' ? searchParams.sortOrder : undefined,
      render: (platform: AuthPlatform) => (
        <Tag color={AUTH_PLATFORM_COLOR_MAP[platform]}>{AUTH_PLATFORM_TEXT_MAP[platform] || platform}</Tag>
      ),
    },
    {
      title: '认证 JSON',
      dataIndex: 'authInfo',
      width: 360,
      ellipsis: true,
      render: (val: AuthInfoListItem['authInfo']) => renderAuthInfoJson(val),
    },
    {
      title: '完整性',
      key: 'complete',
      width: 100,
      render: (_, record) =>
        isAuthInfoComplete(record) ? (
          <Tag color='success'>完整</Tag>
        ) : (
          <Tag color='warning'>不完整</Tag>
        ),
    },
    {
      title: '是否启用',
      dataIndex: 'status',
      width: 110,
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
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      ellipsis: true,
      render: (val?: string | null) => renderOptionalText(val || ''),
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
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<EditOutlined />}
            toolTip='编辑'
            permissionCode='auth_management_update'
            onClick={() => formModalRef.current?.open(record)}
          />
          <MyButton
            type='text'
            size='small'
            danger
            icon={<DeleteOutlined />}
            toolTip='删除'
            permissionCode='auth_management_remove'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const { list, loading, total, otherInfo } = useGetList(reqListAuthInfos, usedSearchParams);
  const stats = otherInfo as Partial<AuthInfoListStats>;

  return (
    <div className={styles['page']}>
      <AuthInfoStat total={total} stats={stats} />

      <Card
        className={styles['listCard']}
        title='认证信息列表'
        extra={
          <MyButton
            type='primary'
            icon={<PlusOutlined />}
            permissionCode='auth_management_create'
            onClick={() => formModalRef.current?.open()}>
            创建认证信息
          </MyButton>
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
          scroll={{ x: 1480 }}
          onChange={(_, __, sorter) => {
            const { field, order } = sorter as SorterResult<AuthInfoListItem>;
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

      <AuthInfoFormModal ref={formModalRef} onSuccess={() => setSearchParams({ ...searchParams })} />
    </div>
  );
};

export default AuthInfo;

interface SearchParams extends PaginationParams {
  keyword?: string;
  platform?: AuthPlatform | string;
  status?: string;
  completeStatus?: AuthInfoCompleteStatus;
}
