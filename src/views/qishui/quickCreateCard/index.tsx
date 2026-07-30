import {
  reqDeleteCardSecret,
  reqListCardSecrets,
  reqUpdateCardSecretStatus,
} from '@/apis/qishui/cardSecret';
import { MyButton, MyPagination } from '@/components';
import { Status } from '@/constants';
import { useCompRef, useGetList, useSearchParams } from '@/hooks';
import { useUser } from '@/hooks/useUser';
import type { CardSecretListItem, CardSecretListStats } from '@/types/cardSecret';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import CardSecretFormModal from '@/views/qishui/cardSecret/components/CardSecretFormModal';
import { copyCardSecretText } from '@/views/qishui/cardSecret/utils/copyCardSecretText';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Segmented, Spin } from 'antd';
import CardSecretMobileItem from './components/CardSecretMobileItem';
import styles from './index.module.less';

type ScopeTab = 'all' | 'mine';

interface SearchParams extends PaginationParams {
  keyword?: string;
  /** 列表范围：全部 / 我的 */
  scope?: ScopeTab;
  createUserId?: string;
}

const defaultSearchParams: SearchParams = {
  pageNum: 1,
  pageSize: 10,
  scope: 'mine',
};

const QuickCreateCard: React.FC = () => {
  const formModalRef = useCompRef(CardSecretFormModal);
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);
  const { userInfo, isAdmin, isSuperAdmin } = useUser();
  const canViewAll = isAdmin || isSuperAdmin;
  const [keywordInput, setKeywordInput] = useState(searchParams.keyword || '');

  const usedSearchParams = useMemo(() => {
    const { scope, keyword } = searchParams;
    const params: SearchParams = {
      ...searchParams,
      keyword: keyword?.trim() || undefined,
      createUserId:
        canViewAll && scope === 'mine' && userInfo?.id ? String(userInfo.id) : undefined,
    };

    return params;
  }, [searchParams, canViewAll, userInfo?.id]);

  const waitingUserForMine = !!canViewAll && searchParams.scope === 'mine' && !userInfo?.id;
  const { list, loading, total, otherInfo } = useGetList(reqListCardSecrets, usedSearchParams, {
    returnFunction: () => !!waitingUserForMine,
  });
  const stats = otherInfo as Partial<CardSecretListStats>;
  const todayCount = stats.todayCount ?? 0;
  const pageStart = ((searchParams.pageNum || 1) - 1) * (searchParams.pageSize || 10);
  const scopeValue = searchParams.scope || 'mine';

  useEffect(() => {
    setKeywordInput(searchParams.keyword || '');
  }, [searchParams.keyword]);

  const handleScopeChange = (value: ScopeTab) => {
    setSearchParams({
      ...searchParams,
      scope: value,
      pageNum: 1,
    });
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(e.target.value);
  };

  const handleSearch = () => {
    setSearchParams({
      ...searchParams,
      keyword: keywordInput.trim() || undefined,
      pageNum: 1,
    });
  };

  const handleKeywordPressEnter = () => {
    handleSearch();
  };

  const handleCreate = () => {
    formModalRef.current?.open();
  };

  const handleEdit = (record: CardSecretListItem) => {
    formModalRef.current?.open(record);
  };

  const handleCopyCardSecretText = (record: CardSecretListItem) => {
    copyCardSecretText(record);
  };

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

  const handleFormSuccess = () => {
    setSearchParams({ ...searchParams });
  };

  const handlePageChange = (pageNum: number, pageSize: number) => {
    setSearchParams({ ...searchParams, pageNum, pageSize });
  };

  return (
    <div className={styles['page']}>
      <div className={styles['glow']} aria-hidden />

      <div className={styles['inner']}>
        <header className={styles['header']}>
          <div className={styles['titleBlock']}>
            <h1 className={styles['title']}>快速创建卡密</h1>
          </div>

          {canViewAll ? (
            <div className={styles['tabs']} role='tablist' aria-label='卡密范围'>
              <Segmented
                value={scopeValue}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '我的', value: 'mine' },
                ]}
                onChange={(val) => handleScopeChange(val as ScopeTab)}
                block
              />
            </div>
          ) : null}
        </header>

        <section className={styles['hero']} aria-label={`今日单数 ${todayCount}`}>
          <div className={styles['heroStat']}>
            <span className={styles['heroLabel']}>今日单数</span>
            <span className={styles['heroValue']}>{todayCount}</span>
            <span className={styles['heroHint']}>今天已创建的卡密数量</span>
          </div>
          <button
            type='button'
            className={styles['createBtn']}
            onClick={handleCreate}
            aria-label='创建卡密'>
            <PlusOutlined aria-hidden />
            <span>创建卡密</span>
          </button>
        </section>

        <div className={styles['searchBar']}>
          <Input
            className={styles['searchInput']}
            allowClear
            value={keywordInput}
            placeholder='搜索卡号、ID、备注'
            prefix={<SearchOutlined className={styles['searchIcon']} />}
            onChange={handleKeywordChange}
            onPressEnter={handleKeywordPressEnter}
            aria-label='搜索卡密'
          />
          <MyButton type='primary' className={styles['searchBtn']} onClick={handleSearch}>
            搜索
          </MyButton>
        </div>

        <div className={styles['sectionHead']}>
          <h2 className={styles['sectionTitle']}>卡密列表</h2>
          <span className={styles['sectionMeta']}>共 {total} 条</span>
        </div>

        <Spin spinning={loading || waitingUserForMine}>
          <div className={styles['list']}>
            {!loading && !waitingUserForMine && list.length === 0 ? (
              <div className={styles['empty']}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className={styles['emptyCopy']}>
                      <p>暂无卡密</p>
                      <span>点右上角创建，马上发出去</span>
                    </div>
                  }
                />
                <button type='button' className={styles['emptyAction']} onClick={handleCreate}>
                  创建第一张卡密
                </button>
              </div>
            ) : (
              list.map((item, idx) => (
                <CardSecretMobileItem
                  key={item.id}
                  record={item}
                  index={pageStart + idx + 1}
                  onCopyText={handleCopyCardSecretText}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </Spin>

        {total > 0 ? (
          <div className={styles['pagination']}>
            <MyPagination
              current={searchParams.pageNum}
              pageSize={searchParams.pageSize}
              total={total}
              onChange={handlePageChange}
              simple
              showQuickJumper={false}
              showSizeChanger={false}
              showTotal={() => ''}
            />
          </div>
        ) : null}

        <CardSecretFormModal ref={formModalRef} onSuccess={handleFormSuccess} />
      </div>

      <div className={styles['dock']} role='region' aria-label='快捷操作'>
        <button
          type='button'
          className={styles['dockBtn']}
          onClick={handleCreate}
          aria-label='创建卡密'>
          <PlusOutlined aria-hidden />
          创建卡密
        </button>
      </div>
    </div>
  );
};

export default QuickCreateCard;
