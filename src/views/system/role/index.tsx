import {
  reqDeletePermissionRole,
  reqListPermissionRoles,
} from '@/apis';
import { MyButton, MyPagination, SearchForm } from '@/components';
import { Status } from '@/constants';
import { useCompRef, useSearchParams } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionRoleItem } from '@/types/permission';
import { downloadAsJson } from '@/utils/download';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Space, Table, Tag } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import ImportRoleModal from './components/ImportRoleModal';
import RoleFormModal from './components/RoleFormModal';
import RoleMemberModal from './components/RoleMemberModal';
import RoleResourceModal from './components/RoleResourceModal';
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<PermissionRoleItem[]>([]);
  const formModalRef = useRef<Ref<void, PermissionRoleItem | void>>(null);
  const importRoleModalRef = useCompRef(ImportRoleModal);
  const resourceModalRef = useCompRef(RoleResourceModal);
  const memberModalRef = useCompRef(RoleMemberModal);

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

  const handleManageResources = (record: PermissionRoleItem) => {
    resourceModalRef.current?.open(record);
  };

  const handleManageMembers = (record: PermissionRoleItem) => {
    memberModalRef.current?.open(record);
  };

  const rowSelection: TableProps<PermissionRoleItem>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys as string[]);
      setSelectedRows(rows as PermissionRoleItem[]);
    },
  };

  const handleImport = () => {
    importRoleModalRef.current?.open();
  };

  const handleExport = async () => {
    if (selectedRows.length === 0) {
      msgError('请至少选择一个角色');
      return;
    }

    try {
      downloadAsJson(selectedRows, 'roleList', { timestamp: true });
      msgSuccess('导出成功');
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
      width: 168,
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
            type='text'
            size='small'
            danger
            icon={<DeleteOutlined />}
            toolTip='删除'
            onClick={() => handleDelete(record)}
          />
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<ApartmentOutlined />}
            toolTip='资源管理'
            onClick={() => handleManageResources(record)}
          />
          <MyButton
            size='small'
            variant='text'
            color='green'
            icon={<TeamOutlined />}
            toolTip='成员管理'
            onClick={() => handleManageMembers(record)}
          />
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
        <Space>
          <MyButton type='primary' icon={<ImportOutlined />} onClick={handleImport}>
            导入角色
          </MyButton>
          <MyButton
            type='primary'
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={!selectedRowKeys.length}>
            导出角色 ({selectedRowKeys.length})
          </MyButton>
          <MyButton type='primary' icon={<PlusOutlined />} onClick={() => formModalRef.current?.open()}>
            新建角色
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
        scroll={{ x: 1100 }}
      />
      <MyPagination
        current={searchParams.pageNum}
        pageSize={searchParams.pageSize}
        total={total}
        onChange={handlePageChange}
      />
      <RoleFormModal ref={formModalRef} onSuccess={fetchList} />
      <ImportRoleModal ref={importRoleModalRef} onSuccess={fetchList} />
      <RoleResourceModal ref={resourceModalRef} />
      <RoleMemberModal ref={memberModalRef} />
    </div>
  );
};

export default RoleManagement;
