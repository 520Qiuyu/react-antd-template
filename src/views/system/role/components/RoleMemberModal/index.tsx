import {
  reqListAllPermissionUserRolesByRole,
  reqListUsers,
  reqSyncPermissionRoleMembers,
} from '@/apis';
import { MyModal } from '@/components';
import { Status } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionRoleItem } from '@/types/permission';
import type { UserListItem } from '@/types/user';
import { msgError, msgSuccess } from '@/utils/modal';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Checkbox, Empty, Input, Pagination, Spin, Tag } from 'antd';
import { forwardRef, useCallback, useEffect } from 'react';
import styles from '../roleModal.module.less';

const DEFAULT_PAGE_SIZE = 10;

function RoleMemberModal(props: Props, ref: React.ForwardedRef<Ref<void, PermissionRoleItem>>) {
  const { onSuccess } = props;
  const [role, setRole] = useState<PermissionRoleItem | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { visible, close } = useVisible(
    {
      onOpen: (record?: PermissionRoleItem) => {
        if (!record) return;
        setRole(record);
        setKeyword('');
        setSearchKeyword('');
        setPageNum(1);
        setUsers([]);
        setUserTotal(0);
        setSelectedUserIds([]);
      },
      onReset: () => {
        setRole(null);
        setUsers([]);
        setUserTotal(0);
        setPageNum(1);
        setKeyword('');
        setSearchKeyword('');
        setSelectedUserIds([]);
        setLoading(false);
        setSubmitting(false);
      },
    },
    ref,
  );

  const fetchRoleMembers = useCallback(async (roleId: string) => {
    const roleMembers = await reqListAllPermissionUserRolesByRole(roleId);
    return roleMembers.map((item) => item.userId);
  }, []);

  const fetchUsers = useCallback(
    async (nextPageNum: number, nextKeyword: string) => {
      const res = await reqListUsers({
        pageNum: nextPageNum,
        pageSize,
        keyword: nextKeyword || undefined,
      });
      if (res.code !== 200) {
        msgError(res.message);
        return false;
      }
      setUsers(res.data?.list ?? []);
      setUserTotal(res.data?.total ?? 0);
      return true;
    },
    [pageSize],
  );

  useEffect(() => {
    if (!visible || !role) return;

    let cancelled = false;
    const loadRoleMembers = async () => {
      try {
        setLoading(true);
        const userIds = await fetchRoleMembers(role.id);
        if (!cancelled) {
          setSelectedUserIds(userIds);
        }
      } catch (error) {
        console.log('error', error);
        if (!cancelled) {
          msgError(error instanceof Error ? error.message : '加载角色成员失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoleMembers();
    return () => {
      cancelled = true;
    };
  }, [visible, role, fetchRoleMembers]);

  useEffect(() => {
    if (!visible || !role) return;

    let cancelled = false;
    const loadUserList = async () => {
      try {
        setLoading(true);
        await fetchUsers(pageNum, searchKeyword);
      } catch (error) {
        console.log('error', error);
        if (!cancelled) {
          msgError(error instanceof Error ? error.message : '加载用户列表失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUserList();
    return () => {
      cancelled = true;
    };
  }, [visible, role, pageNum, searchKeyword, fetchUsers]);

  const enabledUserIds = useMemo(
    () => users.filter((user) => user.status === Status.NORMAL).map((user) => user.id),
    [users],
  );

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      const nextIds = new Set([...selectedUserIds, ...enabledUserIds]);
      setSelectedUserIds([...nextIds]);
      return;
    }
    const enabledSet = new Set(enabledUserIds);
    setSelectedUserIds(selectedUserIds.filter((id) => !enabledSet.has(id)));
  };

  const checkedEnabledCount = selectedUserIds.filter((id) => enabledUserIds.includes(id)).length;
  const isAllChecked = enabledUserIds.length > 0 && checkedEnabledCount === enabledUserIds.length;
  const isIndeterminate = checkedEnabledCount > 0 && !isAllChecked;

  const handleSearch = (value: string) => {
    setSearchKeyword(value.trim());
    setPageNum(1);
  };

  const handleSave = async () => {
    if (!role) return;
    try {
      setSubmitting(true);
      const res = await reqSyncPermissionRoleMembers(role.id, selectedUserIds);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('成员授权成功');
      close();
      await onSuccess?.();
    } catch (error) {
      console.log('error', error);
      msgError(error instanceof Error ? error.message : '成员授权失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title='成员管理'
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={640}
      okText='保存'>
      {role && (
        <div className={styles['roleSummary']}>
          <div className={styles['roleIcon']}>
            <TeamOutlined />
          </div>
          <div className={styles['roleMeta']}>
            <div className={styles['roleName']}>{role.name}</div>
            <div className={styles['roleCode']}>{role.code}</div>
          </div>
          <Tag color='blue' className={styles['selectedCount']}>
            已选 {selectedUserIds.length} 位成员
          </Tag>
        </div>
      )}

      <div className={styles['toolbar']}>
        <Input.Search
          allowClear
          placeholder='搜索账号、昵称、邮箱或手机号'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
        />
        <Checkbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onChange={(e) => handleCheckAll(e.target.checked)}
          disabled={loading || enabledUserIds.length === 0}>
          全选本页
        </Checkbox>
      </div>

      <Spin spinning={loading}>
        <div className={styles['itemList']}>
          {users.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无匹配用户' />
          ) : (
            <Checkbox.Group
              className={styles['itemGroup']}
              value={selectedUserIds}
              onChange={(values) => setSelectedUserIds(values as string[])}>
              {users.map((user) => {
                const disabled = user.status !== Status.NORMAL;
                return (
                  <label
                    key={user.id}
                    className={`${styles['itemRow']} ${disabled ? styles['itemRowDisabled'] : ''}`}>
                    <Checkbox value={user.id} disabled={disabled} />
                    <Avatar
                      size={36}
                      src={user.avatar || undefined}
                      icon={<UserOutlined />}
                      style={{ flexShrink: 0 }}>
                      {!user.avatar ? user.nickname?.[0] || user.account[0] : null}
                    </Avatar>
                    <div className={styles['itemContent']}>
                      <div className={styles['itemHeader']}>
                        <span className={styles['itemTitle']}>
                          {user.nickname || '未设置昵称'}
                        </span>
                        <Tag color={disabled ? 'default' : 'success'}>
                          {disabled ? '已禁用' : '正常'}
                        </Tag>
                      </div>
                      <div className={styles['itemSubTitle']}>{user.account}</div>
                      {user.email && <div className={styles['itemDesc']}>{user.email}</div>}
                    </div>
                  </label>
                );
              })}
            </Checkbox.Group>
          )}
        </div>
        {userTotal > 0 && (
          <div className={styles['pagination']}>
            <Pagination
              simple
              size='small'
              current={pageNum}
              pageSize={pageSize}
              total={userTotal}
              onChange={(nextPageNum) => setPageNum(nextPageNum)}
            />
          </div>
        )}
      </Spin>
    </MyModal>
  );
}

export default forwardRef(RoleMemberModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
