import {
  reqListAllPermissionUserRoles,
  reqListPermissionRoles,
  reqSyncPermissionUserRoles,
} from '@/apis';
import { MyModal } from '@/components';
import { Status } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionRoleItem } from '@/types/permission';
import type { UserListItem } from '@/types/user';
import { msgError, msgSuccess } from '@/utils/modal';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Checkbox, Empty, Input, Pagination, Spin, Tag } from 'antd';
import { forwardRef, useCallback, useEffect, useMemo } from 'react';
import styles from './index.module.less';

const DEFAULT_PAGE_SIZE = 10;

function UserAuthorizeModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, UserListItem>>,
) {
  const { onSuccess } = props;
  const [user, setUser] = useState<UserListItem | null>(null);
  const [roles, setRoles] = useState<PermissionRoleItem[]>([]);
  const [roleTotal, setRoleTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { visible, close } = useVisible(
    {
      onOpen: (record?: UserListItem) => {
        if (!record) return;
        setUser(record);
        setKeyword('');
        setSearchKeyword('');
        setPageNum(1);
        setRoles([]);
        setRoleTotal(0);
        setSelectedRoleIds([]);
      },
      onReset: () => {
        setUser(null);
        setRoles([]);
        setRoleTotal(0);
        setPageNum(1);
        setKeyword('');
        setSearchKeyword('');
        setSelectedRoleIds([]);
        setLoading(false);
        setSubmitting(false);
      },
    },
    ref,
  );

  const fetchUserRoles = useCallback(async (userId: string) => {
    const userRoles = await reqListAllPermissionUserRoles(userId);
    return userRoles.map((item) => item.roleId);
  }, []);

  const fetchRoles = useCallback(
    async (nextPageNum: number, nextKeyword: string) => {
      const res = await reqListPermissionRoles({
        pageNum: nextPageNum,
        pageSize,
        keyword: nextKeyword || undefined,
      });
      if (res.code !== 200) {
        return false;
      }
      setRoles(res.data?.list ?? []);
      setRoleTotal(res.data?.total ?? 0);
      return true;
    },
    [pageSize],
  );

  useEffect(() => {
    if (!visible || !user) return;

    let cancelled = false;
    const loadUserRoles = async () => {
      try {
        setLoading(true);
        const roleIds = await fetchUserRoles(user.id);
        if (!cancelled) {
          setSelectedRoleIds(roleIds);
        }
      } catch (error) {
        console.log('error', error);
        if (!cancelled) {
          msgError(error instanceof Error ? error.message : '加载用户角色失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUserRoles();
    return () => {
      cancelled = true;
    };
  }, [visible, user, fetchUserRoles]);

  useEffect(() => {
    if (!visible || !user) return;

    let cancelled = false;
    const loadRoleList = async () => {
      try {
        setLoading(true);
        await fetchRoles(pageNum, searchKeyword);
      } catch (error) {
        console.log('error', error);
        if (!cancelled) {
          msgError(error instanceof Error ? error.message : '加载角色列表失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoleList();
    return () => {
      cancelled = true;
    };
  }, [visible, user, pageNum, searchKeyword, fetchRoles]);

  const enabledRoleIds = useMemo(
    () => roles.filter((role) => role.status === Status.NORMAL).map((role) => role.id),
    [roles],
  );

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      const nextIds = new Set([...selectedRoleIds, ...enabledRoleIds]);
      setSelectedRoleIds([...nextIds]);
      return;
    }
    const enabledSet = new Set(enabledRoleIds);
    setSelectedRoleIds(selectedRoleIds.filter((id) => !enabledSet.has(id)));
  };

  const checkedEnabledCount = selectedRoleIds.filter((id) => enabledRoleIds.includes(id)).length;
  const isAllChecked =
    enabledRoleIds.length > 0 && checkedEnabledCount === enabledRoleIds.length;
  const isIndeterminate = checkedEnabledCount > 0 && !isAllChecked;

  const handleSearch = (value: string) => {
    setSearchKeyword(value.trim());
    setPageNum(1);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      const res = await reqSyncPermissionUserRoles(user.id, selectedRoleIds);
      if (res.code === 200) {
        msgSuccess('授权成功');
        close();
        await onSuccess?.();
      }
    } catch (error) {
      console.log('error', error);
      msgError(error instanceof Error ? error.message : '授权失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title='用户授权'
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={560}
      okText='保存'>
      {user && (
        <div className={styles['userSummary']}>
          <Avatar
            className={styles['userAvatar']}
            src={user.avatar || undefined}
            icon={<UserOutlined />}
            size={44}>
            {!user.avatar ? user.nickname?.[0] || user.account[0] : null}
          </Avatar>
          <div className={styles['userMeta']}>
            <div className={styles['userName']}>{user.nickname || '未设置昵称'}</div>
            <div className={styles['userAccount']}>{user.account}</div>
          </div>
          <Tag color='blue' className={styles['roleCount']}>
            已选 {selectedRoleIds.length} 个角色
          </Tag>
        </div>
      )}

      <div className={styles['toolbar']}>
        <Input.Search
          allowClear
          placeholder='搜索角色名称或编码'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
        />
        <Checkbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onChange={(e) => handleCheckAll(e.target.checked)}
          disabled={loading || enabledRoleIds.length === 0}>
          全选本页
        </Checkbox>
      </div>

      <Spin spinning={loading}>
        <div className={styles['roleList']}>
          {roles.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无匹配角色' />
          ) : (
            <Checkbox.Group
              className={styles['roleGroup']}
              value={selectedRoleIds}
              onChange={(values) => setSelectedRoleIds(values as string[])}>
              {roles.map((role) => {
                const disabled = role.status !== Status.NORMAL;
                return (
                  <label
                    key={role.id}
                    className={`${styles['roleItem']} ${disabled ? styles['roleItemDisabled'] : ''}`}>
                    <Checkbox value={role.id} disabled={disabled} />
                    <div className={styles['roleContent']}>
                      <div className={styles['roleHeader']}>
                        <span className={styles['roleName']}>{role.name}</span>
                        <Tag color={disabled ? 'default' : 'success'}>
                          {disabled ? '已禁用' : '正常'}
                        </Tag>
                      </div>
                      <div className={styles['roleCode']}>{role.code}</div>
                      {role.description && (
                        <div className={styles['roleDesc']}>{role.description}</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </Checkbox.Group>
          )}
        </div>
        {roleTotal > 0 && (
          <div className={styles['pagination']}>
            <Pagination
              simple
              size='small'
              current={pageNum}
              pageSize={pageSize}
              total={roleTotal}
              onChange={(nextPageNum) => setPageNum(nextPageNum)}
            />
          </div>
        )}
      </Spin>
    </MyModal>
  );
}

export default forwardRef(UserAuthorizeModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
