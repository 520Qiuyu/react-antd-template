import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import { useCompRef, useSearchParams } from '@/hooks';
import type { AuthInfoFormValues, AuthInfoListItem } from '@/types/authInfo';
import { confirm, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import AuthInfoFormModal from './components/AuthInfoFormModal';
import AuthInfoStat from './components/AuthInfoStat';
import styles from './index.module.less';
import { createMockAuthInfos } from './mock';
import { isAuthInfoComplete } from './utils';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

const COMPLETE_OPTIONS = [
  { label: '完整', value: 'complete' },
  { label: '不完整', value: 'incomplete' },
];

/**
 * 认证信息管理
 */
const AuthInfo: React.FC = () => {
  const formModalRef = useCompRef(AuthInfoFormModal);
  const [dataSource, setDataSource] = useState<AuthInfoListItem[]>(() => createMockAuthInfos());
  const [loading, setLoading] = useState(false);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  const filteredList = useMemo(() => {
    const keyword = searchParams.keyword?.trim().toLowerCase();
    return dataSource.filter((item) => {
      const complete = isAuthInfoComplete(item);
      if (searchParams.completeStatus === 'complete' && !complete) return false;
      if (searchParams.completeStatus === 'incomplete' && complete) return false;
      if (!keyword) return true;
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        item.deviceId.toLowerCase().includes(keyword) ||
        item.cookie.toLowerCase().includes(keyword)
      );
    });
  }, [dataSource, searchParams.keyword, searchParams.completeStatus]);

  const pagedList = useMemo(() => {
    const start = (searchParams.pageNum - 1) * searchParams.pageSize;
    return filteredList.slice(start, start + searchParams.pageSize);
  }, [filteredList, searchParams.pageNum, searchParams.pageSize]);

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: AuthInfoListItem) => {
    try {
      await confirm(`确定要删除认证信息「${record.name}」吗？`, '提示');
      setLoading(true);
      setDataSource((prev) => prev.filter((item) => item.id !== record.id));
      msgSuccess('删除成功');
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = async (values: AuthInfoFormValues, record?: AuthInfoListItem) => {
    const now = new Date().toISOString();

    if (record) {
      setDataSource((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                ...values,
                utime: now,
              }
            : item,
        ),
      );
      return;
    }

    const newItem: AuthInfoListItem = {
      id: `auth-${Date.now()}`,
      ...values,
      ctime: now,
      utime: now,
    };
    setDataSource((prev) => [newItem, ...prev]);
    setSearchParams({ ...searchParams, pageNum: 1 });
  };

  const renderOptionalText = (val?: string) =>
    val ? <CopyText text={val} /> : <span className={styles['emptyText']}>-</span>;

  const columns: ColumnsType<AuthInfoListItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 140,
      ellipsis: true,
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
      title: 'Device ID',
      dataIndex: 'deviceId',
      width: 180,
      ellipsis: true,
      render: (val: string) => <CopyText text={val} />,
    },
    {
      title: 'Cookie',
      dataIndex: 'cookie',
      width: 220,
      ellipsis: true,
      render: renderOptionalText,
    },
    {
      title: 'X-Helios',
      dataIndex: 'xHelios',
      width: 180,
      ellipsis: true,
      render: renderOptionalText,
    },
    {
      title: 'X-Medusa',
      dataIndex: 'xMedusa',
      width: 180,
      ellipsis: true,
      render: renderOptionalText,
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
        </Space>
      ),
    },
  ];

  return (
    <div className={styles['page']}>
      <AuthInfoStat list={dataSource} />

      <Card
        className={styles['listCard']}
        title='认证信息列表'
        extra={
          <MyButton
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => formModalRef.current?.open()}>
            创建认证信息
          </MyButton>
        }>
        <div className={styles['toolbar']}>
          <SearchForm
            searchParams={searchParams}
            loading={loading}
            onSearch={handleSearch}
            options={[
              {
                name: 'keyword',
                label: '关键词',
                inputProps: { placeholder: '名称 / ID / Device ID' },
              },
              {
                name: 'completeStatus',
                label: '完整性',
                type: 'select',
                options: COMPLETE_OPTIONS,
                inputProps: {
                  mode: undefined,
                  placeholder: '请选择完整性',
                },
              },
            ]}
          />
        </div>
        <Table
          rowKey='id'
          columns={columns}
          dataSource={pagedList}
          loading={loading}
          pagination={false}
          scroll={{ x: 1620 }}
        />
        <MyPagination
          current={searchParams.pageNum}
          pageSize={searchParams.pageSize}
          total={filteredList.length}
          onChange={(pageNum, pageSize) => setSearchParams({ ...searchParams, pageNum, pageSize })}
        />
      </Card>

      <AuthInfoFormModal ref={formModalRef} onSuccess={handleFormSuccess} />
    </div>
  );
};

export default AuthInfo;

interface SearchParams extends PaginationParams {
  keyword?: string;
  completeStatus?: 'complete' | 'incomplete';
}
