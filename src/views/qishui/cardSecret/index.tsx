import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import { useCompRef, useSearchParams } from '@/hooks';
import type {
  CardSecretFormValues,
  CardSecretListItem,
  CardSecretType,
} from '@/types/cardSecret';
import { confirm, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import CardSecretFormModal from './components/CardSecretFormModal';
import CardSecretStat from './components/CardSecretStat';
import {
  CARD_SECRET_TYPE_COLOR_MAP,
  CARD_SECRET_TYPE_OPTIONS,
  CARD_SECRET_TYPE_TEXT_MAP,
} from './constants';
import styles from './index.module.less';
import { createMockCardSecrets } from './mock';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

/**
 * 卡密管理
 */
const CardSecret: React.FC = () => {
  const formModalRef = useCompRef(CardSecretFormModal);
  const [dataSource, setDataSource] = useState<CardSecretListItem[]>(() => createMockCardSecrets());
  const [loading, setLoading] = useState(false);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  const filteredList = useMemo(() => {
    const keyword = searchParams.keyword?.trim().toLowerCase();
    return dataSource.filter((item) => {
      if (searchParams.type && item.type !== searchParams.type) return false;
      if (!keyword) return true;
      return (
        item.cardNo.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        (item.deviceId || '').toLowerCase().includes(keyword) ||
        (item.cookie || '').toLowerCase().includes(keyword)
      );
    });
  }, [dataSource, searchParams.keyword, searchParams.type]);

  const pagedList = useMemo(() => {
    const start = (searchParams.pageNum - 1) * searchParams.pageSize;
    return filteredList.slice(start, start + searchParams.pageSize);
  }, [filteredList, searchParams.pageNum, searchParams.pageSize]);

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: CardSecretListItem) => {
    try {
      await confirm(`确定要删除卡密「${record.cardNo}」吗？`, '提示');
      setLoading(true);
      setDataSource((prev) => prev.filter((item) => item.id !== record.id));
      msgSuccess('删除成功');
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = async (
    values: CardSecretFormValues,
    record?: CardSecretListItem,
  ) => {
    const now = new Date().toISOString();
    const authFields = {
      deviceId: values.deviceId,
      cookie: values.cookie,
      xHelios: values.xHelios,
      xMedusa: values.xMedusa,
    };

    if (record) {
      setDataSource((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                type: values.type,
                expireTime: values.type === 'time' ? values.expireTime : null,
                parsedCount: values.type === 'count' ? item.parsedCount : 0,
                unparsedCount: values.type === 'count' ? values.parseLimit ?? 100 : 0,
                ...authFields,
                utime: now,
              }
            : item,
        ),
      );
      return;
    }

    const createCount = values.createCount ?? 1;
    const newItems: CardSecretListItem[] = Array.from({ length: createCount }, (_, index) => ({
      id: `cs-${Date.now()}-${index}`,
      cardNo: `QS-${dayjs().format('YYYYMMDD')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      type: values.type,
      expireTime: values.type === 'time' ? values.expireTime : null,
      parsedCount: 0,
      unparsedCount: values.type === 'count' ? values.parseLimit ?? 100 : 0,
      ...authFields,
      ctime: now,
      utime: now,
    }));
    setDataSource((prev) => [...newItems, ...prev]);
    setSearchParams({ ...searchParams, pageNum: 1 });
  };

  const renderParseCount = (record: CardSecretListItem) => {
    const total = record.parsedCount + record.unparsedCount;
    const percent = total > 0 ? (record.parsedCount / total) * 100 : 0;

    return (
      <div className={styles['parseCount']}>
        <div className={styles['parseCountText']}>
          <span className={styles['parsed']}>{record.parsedCount}</span>
          <span className={styles['divider']}>/</span>
          <span className={styles['unparsed']}>{record.unparsedCount}</span>
        </div>
        <div className={styles['parseBar']} aria-hidden>
          <div className={styles['parseBarFill']} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const columns: ColumnsType<CardSecretListItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 140,
      ellipsis: true,
      render: (val: string) => <span className={styles['idCell']}>{val}</span>,
    },
    {
      title: '卡号',
      dataIndex: 'cardNo',
      width: 200,
      fixed: 'left',
      render: (val: string) => <CopyText text={val} />,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: CardSecretType) => (
        <Tag color={CARD_SECRET_TYPE_COLOR_MAP[type]}>{CARD_SECRET_TYPE_TEXT_MAP[type]}</Tag>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      width: 180,
      render: (val?: string | null) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '解析数量（已解析/未解析）',
      key: 'parseCount',
      width: 180,
      render: (_, record) => renderParseCount(record),
    },
    {
      title: '认证信息',
      key: 'auth',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        const hasAuth = !!(record.deviceId || record.cookie || record.xHelios || record.xMedusa);
        if (!hasAuth) return <span className={styles['cookieEmpty']}>未配置</span>;
        return <CopyText text={record.deviceId || record.cookie || '已配置'} />;
      },
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
      <CardSecretStat list={dataSource} />

      <Card
        className={styles['listCard']}
        title='卡密列表'
        extra={
          <MyButton
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => formModalRef.current?.open()}>
            创建卡密
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
                inputProps: { placeholder: '卡号 / ID / Device ID' },
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
            ]}
          />
        </div>
        <Table
          rowKey='id'
          columns={columns}
          dataSource={pagedList}
          loading={loading}
          pagination={false}
          scroll={{ x: 1460 }}
        />
        <MyPagination
          current={searchParams.pageNum}
          pageSize={searchParams.pageSize}
          total={filteredList.length}
          onChange={(pageNum, pageSize) => setSearchParams({ ...searchParams, pageNum, pageSize })}
        />
      </Card>

      <CardSecretFormModal ref={formModalRef} onSuccess={handleFormSuccess} />
    </div>
  );
};

export default CardSecret;

interface SearchParams extends PaginationParams {
  keyword?: string;
  type?: CardSecretType;
}
