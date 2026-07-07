import { reqDeleteUser, reqListUsers, reqUpdateUserStatus } from '@/apis';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import { Status } from '@/constants';
import { useSearchParams } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { UserGender, UserListItem } from '@/types/user';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import UserFormModal from './components/UserFormModal';
import styles from './index.module.less';

const STATUS_OPTIONS = [
  { label: '正常', value: Status.NORMAL },
  { label: '禁用', value: Status.DISABLED },
];

const GENDER_TEXT_MAP: Record<UserGender, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
};

const renderText = (val?: string | null) => val || '-';

const DEFAULT_SEARCH = {
  page: 1,
  pageSize: 10,
  keyword: undefined,
  status: undefined,
};

const UserManagement: React.FC = () => {
  const { searchParams, setSearchParams } = useSearchParams(DEFAULT_SEARCH);
  const [list, setList] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const formModalRef = useRef<Ref<void, UserListItem | void>>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await reqListUsers(searchParams);
      if (res.code !== 200) return msgError(res.message);
      setList(res.data?.list ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [searchParams]);

  const handleSearch = (values: typeof DEFAULT_SEARCH) => {
    setSearchParams({ ...searchParams, ...values, page: 1 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setSearchParams({ ...searchParams, page, pageSize });
  };

  const handleDelete = async (record: UserListItem) => {
    try {
      await confirm(`确定要删除用户「${record.account}」吗？`, '提示');
      const res = await reqDeleteUser(record.id);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('删除成功');
      fetchList();
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
      fetchList();
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
      key: 'user',
      width: 220,
      fixed: 'left',
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
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'utime',
      width: 170,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' onClick={() => formModalRef.current?.open(record)}>
            编辑
          </Button>
          <Button type='link' danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles['page']}>
      <div className={styles['toolbar']}>
        <SearchForm
          searchParams={searchParams}
          loading={loading}
          onSearch={handleSearch}
          options={[
            { name: 'keyword', label: '关键词', inputProps: { placeholder: '账号/昵称/邮箱/手机号' } },
            {
              name: 'status',
              label: '状态',
              type: 'select',
              inputProps: {
                mode: undefined,
                placeholder: '请选择状态',
                options: STATUS_OPTIONS,
              },
            },
          ]}
        />
        <MyButton type='primary' icon={<PlusOutlined />} onClick={() => formModalRef.current?.open()}>
          新建用户
        </MyButton>
      </div>
      <Table
        rowKey='id'
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        scroll={{ x: 1560 }}
      />
      <MyPagination
        current={searchParams.page}
        pageSize={searchParams.pageSize}
        total={total}
        onChange={handlePageChange}
      />
      <UserFormModal ref={formModalRef} onSuccess={fetchList} />
    </div>
  );
};

export default UserManagement;
