import { reqGetSelfUserInfo } from '@/apis';
import { CopyText } from '@/components';
import { useCompRef } from '@/hooks';
import { useAppStore, useUserStore } from '@/store';
import { msgError } from '@/utils/modal';
import { EditOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Descriptions, Divider, Tag } from 'antd';
import EditUserInfoModal from './EditUserInfoModal';
import styles from './index.module.less';
import dayjs from 'dayjs';
import eventBus from '@/utils/eventBus';

export default function UserInfo() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const userInfo = useUserStore((state) => state.userInfo);
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  const clearUser = useUserStore((state) => state.clearUser);
  const clearTabs = useAppStore((state) => state.clearTabs);
  const isLogin = userInfo?.id;

  const handleLogin = () => {
    const callbackUrl = `${pathname}${search}`;
    navigate(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, { replace: true });
  };
  const handleLogout = async () => {
    try {
      clearUser();
      clearTabs();
      eventBus.emit('401');
    } catch (error) {
      console.log('error', error);
    }
  };

  const getUserInfo = async () => {
    try {
      const res = await reqGetSelfUserInfo();
      if (res.code !== 200) return msgError(res.message);
      if (!res.data) return msgError('获取用户信息失败');
      setUserInfo(res.data);
    } catch (error) {
      console.log('error', error);
    }
  };
  useEffect(() => {
    getUserInfo();
  }, []);

  const editUserInfoModalRef = useCompRef(EditUserInfoModal);
  const handleEditInfo = () => {
    editUserInfoModalRef.current?.open();
  };

  return (
    <div className={styles['user-info-container']}>
      {/* 头像 */}
      <Avatar size={32} src={userInfo?.avatar} icon={<UserOutlined />} />
      {isLogin ? (
        // 用户信息
        <div className={styles['name']}>
          <span>{userInfo?.nickname || userInfo?.account}</span>
        </div>
      ) : (
        // 登录按钮
        <Button type='link' style={{ color: '#FFF' }} onClick={handleLogin}>
          登录
        </Button>
      )}

      {/* 弹出层 */}
      {isLogin && (
        <div className={styles['user-popup-wrapper']}>
          <div className={styles['user-popup']}>
            <Descriptions column={1} size='small' style={{ padding: '12px 16px' }}>
              <Descriptions.Item label='账号'>{userInfo?.account}</Descriptions.Item>
              <Descriptions.Item label='用户 ID'>
                <CopyText text={userInfo?.id} />
              </Descriptions.Item>
              {userInfo?.nickname && (
                <Descriptions.Item label='昵称'>{userInfo.nickname}</Descriptions.Item>
              )}
              {userInfo?.email && (
                <Descriptions.Item label='邮箱'>{userInfo.email}</Descriptions.Item>
              )}
              {userInfo?.phone && (
                <Descriptions.Item label='电话'>{userInfo.phone}</Descriptions.Item>
              )}
              {userInfo?.wechat && (
                <Descriptions.Item label='微信'>{userInfo.wechat}</Descriptions.Item>
              )}
              {userInfo?.qq && <Descriptions.Item label='QQ'>{userInfo.qq}</Descriptions.Item>}
              {userInfo?.gender && (
                <Descriptions.Item label='性别'>
                  {GENDER_TEXT_MAP[userInfo.gender]}
                </Descriptions.Item>
              )}
              {userInfo?.birthday && (
                <Descriptions.Item label='生日'>
                  {dayjs(userInfo.birthday).format('YYYY-MM-DD')}
                </Descriptions.Item>
              )}
              {userInfo?.status && (
                <Descriptions.Item label='账号状态'>
                  <Tag color={STATUS_COLOR_MAP[userInfo.status]}>
                    {STATUS_TEXT_MAP[userInfo.status]}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            <Divider style={{ margin: '8px 0' }} />
            <div className={styles['action-buttons']} style={{ padding: '0 16px 12px' }}>
              <Button
                type='text'
                icon={<LogoutOutlined />}
                block
                style={{ textAlign: 'left' }}
                onClick={handleLogout}
                danger>
                退出
              </Button>
              {/* 修改信息 */}
              <Button
                variant='text'
                color='primary'
                icon={<EditOutlined />}
                block
                style={{ textAlign: 'left' }}
                onClick={handleEditInfo}>
                修改信息
              </Button>
            </div>
          </div>
        </div>
      )}
      <EditUserInfoModal ref={editUserInfoModalRef} userInfo={userInfo} onSuccess={getUserInfo} />
    </div>
  );
}

const GENDER_TEXT_MAP: Record<NonNullable<UserInfo['gender']>, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
};

const STATUS_TEXT_MAP: Record<NonNullable<UserInfo['status']>, string> = {
  normal: '正常',
  disabled: '禁用',
  deleted: '已删除',
};

const STATUS_COLOR_MAP: Record<NonNullable<UserInfo['status']>, string> = {
  normal: 'success',
  disabled: 'warning',
  deleted: 'error',
};
