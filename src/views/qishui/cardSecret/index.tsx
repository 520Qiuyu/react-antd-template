import {
  reqDeleteCardSecret,
  reqListCardSecrets,
  reqUpdateCardSecretStatus,
} from '@/apis/qishui/cardSecret';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import { Status, STATUS_OPTIONS } from '@/constants';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import type { CardSecretListItem, CardSecretListStats, CardSecretType } from '@/types/cardSecret';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Space, Switch, Table, Tag } from 'antd';
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

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};
const CardSecret: React.FC = () => {
  const formModalRef = useCompRef(CardSecretFormModal);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);
  const { list, loading, total, otherInfo } = useGetList(reqListCardSecrets, searchParams);
  const stats = otherInfo as Partial<CardSecretListStats>;

  /** 搜索 */
  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  /** 删除 */
  const handleDelete = async (record: CardSecretListItem) => {
    try {
      await confirm(`确定要删除卡密「${record.secret}」吗？`, '提示');
      const res = await reqDeleteCardSecret(record.id);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('删除成功');
      setSearchParams({ ...searchParams });
    } catch (error) {
      console.log('error', error);
    }
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

  /** 渲染解析数量 */
  const renderParseCount = (record: CardSecretListItem) => {
    if (record.type !== 'count') {
      return <span className={styles['cookieEmpty']}>-</span>;
    }

    const totalCount = record.parseLimit || record.parsedCount + record.unparsedCount;
    const percent = totalCount > 0 ? (record.parsedCount / totalCount) * 100 : 0;

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

  /** 列配置 */
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
      dataIndex: 'secret',
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
      title: '解析数量（已解析/剩余）',
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
        const auth = record.authInfo;
        if (!auth?.deviceId && !auth?.cookie) {
          return <span className={styles['cookieEmpty']}>未配置</span>;
        }
        return <CopyText text={auth.deviceId || auth.cookie || '已配置'} />;
      },
    },
    {
      title: '是否启用',
      key: 'status',
      width: 120,
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
      <CardSecretStat total={total} stats={stats} />

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
        </div>
        <Table
          rowKey='id'
          columns={columns}
          dataSource={list}
          loading={loading}
          pagination={false}
          scroll={{ x: 1460 }}
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
    </div>
  );
};

export default CardSecret;

interface SearchParams extends PaginationParams {
  keyword?: string;
  type?: CardSecretType;
  status?: string;
}
