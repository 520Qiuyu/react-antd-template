import {
  reqDeleteCardSecret,
  reqGetCreateUserOptions,
  reqListCardSecrets,
  reqUpdateCardSecretStatus,
} from '@/apis/qishui/cardSecret';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { Status, STATUS_OPTIONS } from '@/constants';
import { getSearchFromObject, useCompRef, useGetList, useSearchParams } from '@/hooks';
import { useUser } from '@/hooks/useUser';
import type { CardSecretListItem, CardSecretListStats, CardSecretType } from '@/types/cardSecret';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import CardSecretFormModal from './components/CardSecretFormModal';
import CardSecretStat from './components/CardSecretStat';
import {
  CARD_SECRET_TYPE_COLOR_MAP,
  CARD_SECRET_TYPE_OPTIONS,
  CARD_SECRET_TYPE_TEXT_MAP,
} from './constants';
import styles from './index.module.less';
import { copyCardSecretText } from './utils/copyCardSecretText';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};
const CardSecret: React.FC = () => {
  const navigate = useNavigate();
  const formModalRef = useCompRef(CardSecretFormModal);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);
  const { isAdmin, isSuperAdmin } = useUser();
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
    // 创建者
    isAdmin || isSuperAdmin
      ? {
          name: 'createUserId',
          label: '创建者',
          type: 'select',
          getOptionsApi: reqGetCreateUserOptions,
        }
      : undefined,
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: STATUS_OPTIONS,
    },
  ].filter(Boolean) as SearchFormOption[];

  /** 搜索 */
  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  /** 删除 */
  const handleDelete = async (record: CardSecretListItem) => {
    try {
      await confirm(`确定要删除卡密「${record.secret}」吗？`, '提示');
      const res = await reqDeleteCardSecret(record.id);
      if (res.code === 200) {
        msgSuccess('删除成功');
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  /** 复制卡密发货文本 */
  const handleCopyCardSecretText = (record: CardSecretListItem) => {
    copyCardSecretText(record);
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

  /** 跳转解析日志，按当前卡密筛选 */
  const handleGoParseLogs = (record: CardSecretListItem) => {
    const search = getSearchFromObject({
      pageNum: 1,
      pageSize: 10,
      keyword: record.secret,
    });
    navigate(`/qishui/logs?${search}`);
  };

  /** 渲染解析用量：紧凑双行，不撑高表格 */
  const renderParseCount = (record: CardSecretListItem) => {
    const hasDailyLimit = record.dailyParseLimit != null && record.dailyParseLimit > 0;
    const dailyUsed = record.dailyParsedCount ?? 0;
    const dailyLimit = record.dailyParseLimit || 0;
    const dailyPercent = hasDailyLimit
      ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 1000) / 10)
      : 0;

    const hasTotalLimit = record.type === 'count' && (record.parseLimit || 0) > 0;
    const totalUsed = record.parsedCount || 0;
    const totalLimit = record.parseLimit || 0;
    const totalRemain = hasTotalLimit ? Math.max(0, totalLimit - totalUsed) : null;
    const totalPercent = hasTotalLimit
      ? Math.min(100, Math.round((totalUsed / totalLimit) * 1000) / 10)
      : 0;

    const dailyIsPrimary = hasDailyLimit && record.type === 'time';
    const primaryPercent = dailyIsPrimary ? dailyPercent : totalPercent;
    const showPrimaryBar = dailyIsPrimary ? hasDailyLimit : hasTotalLimit;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleGoParseLogs(record);
      }
    };

    return (
      <div
        className={styles['parseUsage']}
        role='link'
        tabIndex={0}
        aria-label={`查看卡密 ${record.secret} 的解析日志`}
        onClick={() => handleGoParseLogs(record)}
        onKeyDown={handleKeyDown}>
        {hasDailyLimit ? (
          <div className={styles['usageLine']}>
            <span className={styles['usageLabel']}>今日</span>
            <span className={styles['usageNums']}>
              <strong className={dailyIsPrimary ? styles['isPrimary'] : undefined}>
                {dailyUsed}
              </strong>
              <span>/ {dailyLimit}</span>
            </span>
          </div>
        ) : null}

        <div className={styles['usageLine']}>
          <span className={styles['usageLabel']}>总解析</span>
          <span className={styles['usageNums']}>
            <strong className={!dailyIsPrimary ? styles['isPrimary'] : undefined}>
              {totalUsed}
            </strong>
            {hasTotalLimit ? <span>/ {totalLimit}</span> : null}
            {totalRemain !== null ? <em>剩 {totalRemain}</em> : null}
          </span>
        </div>

        {showPrimaryBar ? (
          <div
            className={styles['usageTrack']}
            role='progressbar'
            aria-valuenow={primaryPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={dailyIsPrimary ? '今日解析进度' : '总解析进度'}>
            <div
              className={classNames(styles['usageFill'], {
                [styles['usageFillWarn']]: primaryPercent >= 90,
              })}
              style={{ width: `${primaryPercent}%` }}
            />
          </div>
        ) : null}
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
      sorter: true,
      sortOrder: searchParams.sortField === 'id' ? searchParams.sortOrder : undefined,
      render: (val: string) => <span className={styles['idCell']}>{val}</span>,
    },
    {
      title: '卡号',
      dataIndex: 'secret',
      width: 200,
      fixed: 'left',
      sorter: true,
      sortOrder: searchParams.sortField === 'secret' ? searchParams.sortOrder : undefined,
      render: (val: string) => <CopyText text={val} />,
    },
    {
      title: '创建者',
      dataIndex: 'createUser',
      width: 120,
      render: (val: { account: string }) => <span>{val?.account}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      sorter: true,
      sortOrder: searchParams.sortField === 'type' ? searchParams.sortOrder : undefined,
      render: (type: CardSecretType) => (
        <Tag color={CARD_SECRET_TYPE_COLOR_MAP[type]}>{CARD_SECRET_TYPE_TEXT_MAP[type]}</Tag>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      width: 180,
      sorter: true,
      sortOrder: searchParams.sortField === 'expireTime' ? searchParams.sortOrder : undefined,
      render: (val?: string | null) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '解析用量',
      key: 'parseCount',
      dataIndex: 'parsedCount',
      width: 160,
      sorter: true,
      sortOrder: searchParams.sortField === 'parsedCount' ? searchParams.sortOrder : undefined,
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
      dataIndex: 'status',
      width: 120,
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
          {/* 复制卡密发货文本 */}
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<CopyOutlined />}
            toolTip='复制卡密发货文本'
            onClick={() => handleCopyCardSecretText(record)}
          />
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

  const { list, loading, total, otherInfo } = useGetList(reqListCardSecrets, usedSearchParams);
  const stats = otherInfo as Partial<CardSecretListStats>;

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
            options={searchFormOptions}
          />
        </div>
        <Table
          rowKey='id'
          columns={columns}
          dataSource={list}
          loading={loading}
          pagination={false}
          scroll={{ x: 1460 }}
          onChange={(_, __, sorter) => {
            const { field, order } = sorter as SorterResult<CardSecretListItem>;
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
  type?: CardSecretType | string;
  status?: string;
  createUserId?: string;
}
