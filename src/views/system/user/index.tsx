import { reqDeleteUser, reqListUsers, reqUpdateUserStatus } from '@/apis';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import { Status, STATUS_OPTIONS } from '@/constants';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import type { UserGender, UserListItem } from '@/types/user';
import { downloadAsJson } from '@/utils/download';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Space, Switch, Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import ImportUserModal from './components/ImportUserModal';
import UserAuthorizeModal from './components/UserAuthorizeModal';
import UserFormModal from './components/UserFormModal';
import styles from './index.module.less';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

const UserManagement: React.FC = () => {
  const formModalRef = useCompRef(UserFormModal);
  const authorizeModalRef = useCompRef(UserAuthorizeModal);
  const importUserModalRef = useCompRef(ImportUserModal);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<UserListItem[]>([]);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);
  const usedSearchParams = useMemo(() => {
    const { sortOrder, ...rest } = searchParams;
    return {
      ...rest,
      sortOrder: sortOrder === 'ascend' ? 'asc' : 'desc',
    };
  }, [searchParams]);

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: UserListItem) => {
    try {
      await confirm(`确定要删除用户「${record.account}」吗？`, '提示');
      const res = await reqDeleteUser(record.id);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('删除成功');
      setSearchParams({ ...searchParams });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleToggleStatus = async (record: UserListItem, checked: boolean) => {
    const nextStatus = checked ? ('normal' as const) : ('disabled' as const);
    const actionText = checked ? '启用' : '禁用';
    try {
      await confirm(`确定要${actionText}用户「${record.account}」吗？`, '提示');
      const res = await reqUpdateUserStatus(record.id, { status: nextStatus });
      if (res.code !== 200) return msgError(res.message);
      msgSuccess(`${actionText}成功`);
      setSearchParams({ ...searchParams });
    } catch (error) {
      console.log('error', error);
    }
  };

  const rowSelection: TableProps<UserListItem>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys as string[]);
      setSelectedRows(rows as UserListItem[]);
    },
  };

  const handleImport = () => {
    importUserModalRef.current?.open();
  };

  const handleExport = async () => {
    if (selectedRows.length === 0) {
      msgError('请至少选择一个用户');
      return;
    }

    try {
      downloadAsJson(selectedRows, 'userList', { timestamp: true });
      msgSuccess('导出成功');
    } catch (error) {
      console.log('error', error);
    }
  };

  const renderUserCell = (record: UserListItem) => (
    <div className={styles['userCell']}>
      <Avatar
        className={styles['userAvatar']}
        src={record.avatar || undefined}
        icon={<UserOutlined />}
        size={40}>
        {!record.avatar ? record.nickname?.[0] || record.account[0] : null}
      </Avatar>
      <div className={styles['userInfo']}>
        <span
          className={record.nickname ? styles['userNickname'] : styles['userNicknamePlaceholder']}
          title={record.nickname || undefined}>
          {record.nickname || '未设置昵称'}
        </span>
        <CopyText text={record.account} className={styles['userAccount']} />
      </div>
    </div>
  );

  const columns: ColumnsType<UserListItem> = [
    {
      title: '用户',
      dataIndex: 'account',
      width: 220,
      fixed: 'left',
      sorter: true,
      sortOrder: searchParams.sortField === 'account' ? searchParams.sortOrder : undefined,
      render: (_, record) => renderUserCell(record),
    },
    { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true, render: renderText },
    { title: '手机号', dataIndex: 'phone', width: 130, render: renderText },
    { title: '微信', dataIndex: 'wechat', width: 120, render: renderText },
    { title: 'QQ', dataIndex: 'qq', width: 120, render: renderText },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      render: (gender?: UserGender | null) => (gender ? GENDER_TEXT_MAP[gender] : '-'),
    },
    {
      title: '生日',
      dataIndex: 'birthday',
      width: 120,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      sorter: true,
      sortOrder: searchParams.sortField === 'status' ? searchParams.sortOrder : undefined,
      render: (status: string, record) => (
        <Switch
          checked={status === Status.NORMAL}
          checkedChildren='正常'
          unCheckedChildren='禁用'
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'ctime',
      width: 170,
      sorter: true,
      sortOrder: searchParams.sortField === 'ctime' ? searchParams.sortOrder : undefined,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'utime',
      width: 170,
      sorter: true,
      sortOrder: searchParams.sortField === 'utime' ? searchParams.sortOrder : undefined,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
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
            onClick={() => formModalRef.current?.open(record)}
          />
          <MyButton
            size='small'
            variant='text'
            color='green'
            icon={<SafetyCertificateOutlined />}
            toolTip='授权'
            onClick={() => authorizeModalRef.current?.open(record)}
          />
          <MyButton
            type='text'
            size='small'
            danger
            icon={<DeleteOutlined />}
            toolTip='删除'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];
  const { list, loading, total } = useGetList(reqListUsers, usedSearchParams);

  return (
    <div className={styles['page']}>
      <div className={styles['toolbar']}>
        <SearchForm
          searchParams={searchParams}
          loading={loading}
          onSearch={handleSearch}
          options={[
            {
              name: 'keyword',
              label: '关键词',
              inputProps: { placeholder: '账号/昵称/邮箱/手机号' },
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
          ]}
        />
        <Space>
          <MyButton type='primary' icon={<ImportOutlined />} onClick={handleImport}>
            导入用户
          </MyButton>
          <MyButton
            type='primary'
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={!selectedRowKeys.length}>
            导出用户 ({selectedRowKeys.length})
          </MyButton>
          <MyButton
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => formModalRef.current?.open()}>
            新建用户
          </MyButton>
        </Space>
      </div>
      <Table
        rowKey='id'
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        rowSelection={rowSelection}
        scroll={{ x: 1560 }}
        onChange={(_, __, sorter) => {
          console.log('sorter', sorter);
          const { field, order } = sorter as SorterResult<UserListItem>;
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
      <UserFormModal
        ref={formModalRef}
        onSuccess={() =>
          setSearchParams({
            ...searchParams,
            pageNum: 1,
          })
        }
      />
      <UserAuthorizeModal ref={authorizeModalRef} />
      <ImportUserModal
        ref={importUserModalRef}
        onSuccess={() =>
          setSearchParams({
            ...searchParams,
            pageNum: 1,
          })
        }
      />
    </div>
  );
};

export default UserManagement;

interface SearchParams extends PaginationParams {
  keyword?: string;
  status?: Exclude<UserStatus, 'deleted'>;
}

const GENDER_TEXT_MAP: Record<UserGender, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
};

const renderText = (val?: string | null) => val || '-';
