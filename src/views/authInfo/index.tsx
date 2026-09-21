import {
  reqDeleteAuthInfo,
  reqListAuthInfos,
  reqUpdateAuthInfoStatus,
  reqValidateAuthInfo,
} from '@/apis/authManagement';
import { CopyText, MyButton, MyPagination, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { Status, STATUS_OPTIONS } from '@/constants';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import type { AuthInfoListItem, AuthInfoListStats, AuthPlatform } from '@/types/authInfo';
import { downloadAsJson } from '@/utils/download';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Card, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import AuthInfoFormModal from './components/AuthInfoFormModal';
import AuthInfoStat from './components/AuthInfoStat';
import ImportAuthInfoModal from './components/ImportAuthInfoModal';
import {
  AUTH_AVAILABLE_OPTIONS,
  AUTH_PLATFORM_COLOR_MAP,
  AUTH_PLATFORM_OPTIONS,
  AUTH_PLATFORM_TEXT_MAP,
  VALIDATE_BATCH_INTERVAL_MS,
} from './constants';
import styles from './index.module.less';
import { sleep, stringifyAuthInfoJson, toExportAuthInfoItem } from './utils';

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
};

/**
 * 认证信息管理
 */
const AuthInfo: React.FC = () => {
  const formModalRef = useCompRef(AuthInfoFormModal);
  const importModalRef = useCompRef(ImportAuthInfoModal);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<AuthInfoListItem[]>([]);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

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
      inputProps: { placeholder: '名称 / ID / 备注' },
    },
    {
      name: 'platform',
      label: '平台',
      type: 'select',
      options: AUTH_PLATFORM_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择平台',
      },
    },
    // 是否可用
    {
      name: 'isAvailable',
      label: '是否可用',
      type: 'select',
      options: AUTH_AVAILABLE_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择是否可用',
      },
    },
    {
      name: 'status',
      label: '是否启用',
      type: 'select',
      options: STATUS_OPTIONS,
      inputProps: {
        mode: undefined,
        placeholder: '请选择是否启用',
      },
    },
  ];

  const handleSearch = (values: SearchParams) => {
    setSearchParams({ ...searchParams, ...values, pageNum: 1 });
  };

  const handleDelete = async (record: AuthInfoListItem) => {
    try {
      await confirm(`确定要删除认证信息「${record.name || record.id}」吗？`, '提示');
      const res = await reqDeleteAuthInfo(record.id);
      if (res.code === 200) {
        msgSuccess('删除成功');
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleValidate = async (record: AuthInfoListItem) => {
    try {
      const res = await reqValidateAuthInfo({ id: record.id });
      if (res.code === 200) {
        if (res.data?.isAvailable) {
          msgSuccess(res.message || '账号可用');
        } else {
          msgError(res.message || '账号不可用');
        }
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  /**
   * 批量校验已选认证信息，每条间隔 200ms
   * @example
   * ```ts
   * await handleValidateBatch();
   * ```
   */
  const handleValidateBatch = async () => {
    if (!selectedRowKeys.length) {
      msgError('请至少选择一条认证信息');
      return;
    }
    try {
      await confirm(`确定要批量校验已选的 ${selectedRowKeys.length} 条认证信息吗？`, '提示');
      let availableCount = 0;
      let unavailableCount = 0;
      let failCount = 0;
      for (let i = 0; i < selectedRowKeys.length; i++) {
        const id = selectedRowKeys[i];
        try {
          const res = await reqValidateAuthInfo({ id });
          if (res.code === 200) {
            if (res.data?.isAvailable) {
              availableCount += 1;
            } else {
              unavailableCount += 1;
            }
          } else {
            failCount += 1;
          }
        } catch (error) {
          console.log('error', error);
          failCount += 1;
        }
        if (i < selectedRowKeys.length - 1) {
          await sleep(VALIDATE_BATCH_INTERVAL_MS);
        }
      }
      msgSuccess(
        `批量校验完成：可用 ${availableCount}，不可用 ${unavailableCount}，失败 ${failCount}`,
      );
      setSearchParams({ ...searchParams });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleStatusChange = async (record: AuthInfoListItem, checked: boolean) => {
    const nextStatus = checked ? Status.NORMAL : Status.DISABLED;
    const actionText = checked ? '启用' : '禁用';
    try {
      await confirm(`确定要${actionText}认证信息「${record.name || record.id}」吗？`, '提示');
      const res = await reqUpdateAuthInfoStatus(record.id, { status: nextStatus });
      if (res.code === 200) {
        msgSuccess(`${actionText}成功`);
        setSearchParams({ ...searchParams });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const rowSelection: TableProps<AuthInfoListItem>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys as string[]);
      setSelectedRows(rows as AuthInfoListItem[]);
    },
  };

  const handleImport = () => {
    importModalRef.current?.open();
  };

  const handleExport = () => {
    if (!selectedRows.length) {
      msgError('请至少选择一条认证信息');
      return;
    }

    try {
      downloadAsJson(selectedRows.map(toExportAuthInfoItem), 'authInfoList', { timestamp: true });
      msgSuccess('导出成功');
    } catch (error) {
      console.log('error', error);
    }
  };

  const renderOptionalText = (val?: string) =>
    val ? <CopyText text={val} /> : <span className={styles['emptyText']}>-</span>;

  const renderAuthInfoJson = (payload?: AuthInfoListItem['authInfo']) => {
    const prettyText = stringifyAuthInfoJson(payload, ['name']);
    const compactText = prettyText.replace(/\s+/g, ' ').trim();
    if (compactText === '{}') {
      return <span className={styles['emptyText']}>-</span>;
    }
    return <CopyText className={styles['jsonCell']} text={prettyText} showText={compactText} />;
  };

  const columns: ColumnsType<AuthInfoListItem> = [
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
      title: '名称',
      dataIndex: 'name',
      width: 160,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 120,
      sorter: true,
      sortOrder: searchParams.sortField === 'platform' ? searchParams.sortOrder : undefined,
      render: (platform: AuthPlatform) => (
        <Tag color={AUTH_PLATFORM_COLOR_MAP[platform]}>
          {AUTH_PLATFORM_TEXT_MAP[platform] || platform}
        </Tag>
      ),
    },
    {
      title: '认证 JSON',
      dataIndex: 'authInfo',
      width: 360,
      ellipsis: true,
      render: (val: AuthInfoListItem['authInfo']) => renderAuthInfoJson(val),
    },
    {
      title: '是否可用',
      dataIndex: 'isAvailable',
      width: 110,
      sorter: true,
      sortOrder: searchParams.sortField === 'isAvailable' ? searchParams.sortOrder : undefined,
      render: (val: boolean) =>
        val ? <Tag color='success'>可用</Tag> : <Tag color='default'>不可用</Tag>,
    },
    {
      title: '使用次数',
      dataIndex: 'useCount',
      width: 110,
      sorter: true,
      sortOrder: searchParams.sortField === 'useCount' ? searchParams.sortOrder : undefined,
      render: (val?: number) => val ?? 0,
    },
    {
      title: '是否启用',
      dataIndex: 'status',
      width: 110,
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
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      ellipsis: true,
      render: (val?: string | null) => renderOptionalText(val || ''),
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
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space align='center' size={4}>
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<SafetyCertificateOutlined />}
            toolTip='校验可用性'
            permissionCode='auth_management_update'
            onClick={() => handleValidate(record)}
          />
          <MyButton
            size='small'
            variant='text'
            color='primary'
            icon={<EditOutlined />}
            toolTip='编辑'
            permissionCode='auth_management_update'
            onClick={() => formModalRef.current?.open(record)}
          />
          <MyButton
            type='text'
            size='small'
            danger
            icon={<DeleteOutlined />}
            toolTip='删除'
            permissionCode='auth_management_remove'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const { list, loading, total, otherInfo } = useGetList(reqListAuthInfos, usedSearchParams);
  const stats = otherInfo as Partial<AuthInfoListStats>;

  return (
    <div className={styles['page']}>
      <AuthInfoStat total={total} stats={stats} />

      <Card
        className={styles['listCard']}
        title='认证信息列表'
        extra={
          <Space>
            {/* 批量校验认证信息 */}
            <MyButton
              type='primary'
              icon={<CheckOutlined />}
              permissionCode='auth_management_update'
              disabled={!selectedRowKeys.length}
              onClick={handleValidateBatch}>
              批量校验认证信息 ({selectedRowKeys.length})
            </MyButton>
            <MyButton
              type='primary'
              icon={<ImportOutlined />}
              permissionCode='auth_management_create'
              onClick={handleImport}>
              导入认证信息
            </MyButton>
            <MyButton
              type='primary'
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={!selectedRowKeys.length}>
              导出认证信息 ({selectedRowKeys.length})
            </MyButton>
            <MyButton
              type='primary'
              icon={<PlusOutlined />}
              permissionCode='auth_management_create'
              onClick={() => formModalRef.current?.open()}>
              创建认证信息
            </MyButton>
          </Space>
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
          rowSelection={rowSelection}
          scroll={{ x: 1600 }}
          onChange={(_, __, sorter) => {
            const { field, order } = sorter as SorterResult<AuthInfoListItem>;
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

      <AuthInfoFormModal
        ref={formModalRef}
        onSuccess={() => setSearchParams({ ...searchParams })}
      />
      <ImportAuthInfoModal
        ref={importModalRef}
        onSuccess={() => setSearchParams({ ...searchParams })}
      />
    </div>
  );
};

export default AuthInfo;

interface SearchParams extends PaginationParams {
  keyword?: string;
  platform?: AuthPlatform | string;
  status?: string;
  isAvailable?: boolean;
}
