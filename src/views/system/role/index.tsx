import {
  reqDeletePermissionRole,
  reqListPermissionRoles,
} from '@/apis';
import { MyButton, MyPagination, SearchForm } from '@/components';
import { Status } from '@/constants';
import { useSearchParams } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionRoleItem } from '@/types/permission';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import RoleFormModal from './components/RoleFormModal';
import styles from './index.module.less';

const STATUS_OPTIONS = [
  { label: '正常', value: Status.NORMAL },
  { label: '禁用', value: Status.DISABLED },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  [Status.NORMAL]: { label: '正常', color: 'success' },
  [Status.DISABLED]: { label: '禁用', color: 'error' },
};

const DEFAULT_SEARCH = {
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  status: undefined,
};

const RoleManagement: React.FC = () => {
  const { searchParams, setSearchParams } = useSearchParams(DEFAULT_SEARCH);
  const [list, setList] = useState<PermissionRoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const formModalRef = useRef<Ref<void, PermissionRoleItem | void>>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await reqListPermissionRoles(searchParams);
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
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handlePageChange = (pageNum: number, pageSize: number) => {
    setSearchParams({ ...searchParams, pageNum, pageSize });
  };

  const handleDelete = async (record: PermissionRoleItem) => {
    try {
      await confirm(`确定要删除角色「${record.name}」吗？`, '提示');
      const res = await reqDeletePermissionRole(record.id);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('删除成功');
      fetchList();
    } catch (error) {
      console.log('error', error);
    }
  };

  const columns: ColumnsType<PermissionRoleItem> = [
    { title: '角色名称', dataIndex: 'name', width: 160 },
    { title: '角色编码', dataIndex: 'code', width: 160 },
    { title: '描述', dataIndex: 'description', ellipsis: true, render: (val) => val || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const item = STATUS_MAP[status] ?? { label: status, color: 'default' };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true, render: (val) => val || '-' },
    {
      title: '创建时间',
      dataIndex: 'ctime',
      width: 180,
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
            { name: 'keyword', label: '关键词', inputProps: { placeholder: '名称/编码/描述' } },
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
          新建角色
        </MyButton>
      </div>
      <Table
        rowKey='id'
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        scroll={{ x: 1100 }}
      />
      <MyPagination
        current={searchParams.pageNum}
        pageSize={searchParams.pageSize}
        total={total}
        onChange={handlePageChange}
      />
      <RoleFormModal ref={formModalRef} onSuccess={fetchList} />
    </div>
  );
};

export default RoleManagement;
