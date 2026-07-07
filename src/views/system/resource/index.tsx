import {
  reqDeletePermissionResource,
  reqListPermissionResources,
} from '@/apis';
import { MyButton, MyPagination, SearchForm } from '@/components';
import { useSearchParams } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionResourceItem, PermissionResourceType } from '@/types/permission';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ResourceFormModal from './components/ResourceFormModal';
import styles from './index.module.less';

const TYPE_OPTIONS = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
  { label: '接口', value: 'api' },
];

const TYPE_MAP: Record<PermissionResourceType, { label: string; color: string }> = {
  menu: { label: '菜单', color: 'blue' },
  button: { label: '按钮', color: 'purple' },
  api: { label: '接口', color: 'cyan' },
};

const DEFAULT_SEARCH = {
  page: 1,
  pageSize: 10,
  keyword: undefined,
  type: undefined,
};

const ResourceManagement: React.FC = () => {
  const { searchParams, setSearchParams } = useSearchParams(DEFAULT_SEARCH);
  const [list, setList] = useState<PermissionResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const formModalRef = useRef<Ref<void, PermissionResourceItem | void>>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await reqListPermissionResources(searchParams);
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

  const handleDelete = async (record: PermissionResourceItem) => {
    try {
      await confirm(`确定要删除资源「${record.name}」吗？`, '提示');
      const res = await reqDeletePermissionResource(record.id);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('删除成功');
      fetchList();
    } catch (error) {
      console.log('error', error);
    }
  };

  const columns: ColumnsType<PermissionResourceItem> = [
    { title: '资源名称', dataIndex: 'name', width: 160 },
    { title: '资源编码', dataIndex: 'code', width: 160 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: PermissionResourceType) => {
        const item = TYPE_MAP[type] ?? { label: type, color: 'default' };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    { title: 'URL', dataIndex: 'url', width: 200, ellipsis: true, render: (val) => val || '-' },
    { title: 'Method', dataIndex: 'method', width: 100, render: (val) => val || '-' },
    { title: '父级 ID', dataIndex: 'parentId', width: 140, render: (val) => val || '-' },
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
            { name: 'keyword', label: '关键词', inputProps: { placeholder: '名称/编码/URL' } },
            {
              name: 'type',
              label: '类型',
              type: 'select',
              inputProps: {
                mode: undefined,
                placeholder: '请选择类型',
                options: TYPE_OPTIONS,
              },
            },
          ]}
        />
        <MyButton type='primary' icon={<PlusOutlined />} onClick={() => formModalRef.current?.open()}>
          新建资源
        </MyButton>
      </div>
      <Table
        rowKey='id'
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        scroll={{ x: 1300 }}
      />
      <MyPagination
        current={searchParams.page}
        pageSize={searchParams.pageSize}
        total={total}
        onChange={handlePageChange}
      />
      <ResourceFormModal ref={formModalRef} onSuccess={fetchList} />
    </div>
  );
};

export default ResourceManagement;
