import { reqGetLogout } from '@/apis';
import { useAppStore, useUserStore } from '@/store';
import { msgError } from '@/utils/modal';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Descriptions, Divider } from 'antd';
import styles from './index.module.less';

export default function UserInfo() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const userInfo = useUserStore((state) => state.userInfo);
  const clearUser = useUserStore((state) => state.clearUser);
  const clearTabs = useAppStore((state) => state.clearTabs);
  const isLogin = userInfo?.userId;

  const handleLogin = () => {
    const callbackUrl = `${pathname}${search}`;
    navigate(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, { replace: true });
  };
  const handleLogout = async () => {
    try {
      const res = await reqGetLogout();
      const { meta } = res;
      if (meta?.statusCode === 200) {
        clearUser();
        clearTabs();
      } else {
        msgError('退出登陆失败，请稍后再试一次！');
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <div className={styles['user-info-container']}>
      {/* 头像 */}
      <Avatar size={32} src={userInfo?.avatar} icon={<UserOutlined />} />
      {isLogin ? (
        // 用户信息
        <div className={styles['name']}>
          <span>{userInfo?.nickName || userInfo?.account}</span>
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
              <Descriptions.Item label='昵称'>{userInfo?.nickName || '-'}</Descriptions.Item>
              <Descriptions.Item label='学工号'>{userInfo?.userId}</Descriptions.Item>
              <Descriptions.Item label='邮箱'>{userInfo?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label='电话'>{userInfo?.phone || '-'}</Descriptions.Item>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
