import { reqDeletePermissionResource, reqListPermissionResources } from '@/apis';
import { MyButton, MyPagination, SearchForm } from '@/components';
import { useGetList, useSearchParams } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionResourceItem, PermissionResourceType } from '@/types/permission';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { RESOURCE_TYPE_MAP, RESOURCE_TYPE_OPTIONS } from '../../constants';
import styles from './index.module.less';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

interface Props {
  formModalRef: React.RefObject<Ref<void, PermissionResourceItem | void> | null>;
  refreshKey?: number;
}

const ResourceListView: React.FC<Props> = ({ formModalRef, refreshKey }) => {
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);
  const usedSearchParams = useMemo(() => {
    return {
      ...searchParams,
    };
  }, [searchParams]);

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: PermissionResourceItem) => {
    try {
      await confirm(`确定要删除资源「${record.name}」吗？`, '提示');
      const res = await reqDeletePermissionResource(record.id);
      if (res.code === 200) {
        msgSuccess('删除成功');
        setSearchParams({ ...searchParams, pageNum: 1 });
      }
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
        const item = RESOURCE_TYPE_MAP[type] ?? { label: type, color: 'default' };
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
      align: 'center',
      render: (_, record) => (
        <Space>
          <MyButton
            variant='text'
            color='primary'
            icon={<EditOutlined />}
            toolTip='编辑'
            onClick={() => formModalRef.current?.open(record)}
          />
          <MyButton
            variant='text'
            color='danger'
            icon={<DeleteOutlined />}
            toolTip='删除'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];
  const { list, total, loading } = useGetList(reqListPermissionResources, usedSearchParams, {
    monitors: [usedSearchParams, refreshKey],
  });

  return (
    <div className={styles['view']}>
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
                options: RESOURCE_TYPE_OPTIONS,
              },
            },
          ]}
        />
        <MyButton
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => formModalRef.current?.open()}>
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
        current={searchParams.pageNum}
        pageSize={searchParams.pageSize}
        total={total}
        onChange={(pageNum, pageSize) => setSearchParams({ ...searchParams, pageNum, pageSize })}
      />
    </div>
  );
};

export default ResourceListView;

interface SearchParams {
  keyword?: string;
  type?: string;
  pageNum: number;
  pageSize: number;
}
