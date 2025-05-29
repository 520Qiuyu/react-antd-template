import { reqGetLogout } from '@/apis';
import { useAppSelector } from '@/hooks';
import { goToLogin, goToLogout } from '@/utils/casLogin';
import { msgError } from '@/utils/modal';
import { clearAllLocalUserInfo } from '@/utils/userInfo';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Descriptions, Divider } from 'antd';
import styles from './index.module.less';
import { config } from '@/config';
import { clearTabInfo } from '@/utils/app';

export default function UserInfo() {
  const { userInfo } = useAppSelector((state) => state.user);
  const isLogin = userInfo?.userId;

  const handleLogin = () => {
    goToLogin();
  };
  const handleLogout = async () => {
    try {
      const res = await reqGetLogout();
      const { meta } = res;
      if (meta?.statusCode === 200) {
        clearAllLocalUserInfo();
        clearTabInfo();
        if (config.casLogin) {
          goToLogout();
        } else {
          goToLogin();
        }
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
      <Avatar size={32} icon={<UserOutlined />} />
      {isLogin ? (
        // 用户信息
        <div className={styles['name']}>
          <span>{userInfo?.userName}</span>
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
              <Descriptions.Item label='姓名'>{userInfo?.userName}</Descriptions.Item>
              <Descriptions.Item label='学工号'>{userInfo?.userId}</Descriptions.Item>
              <Descriptions.Item label='邮箱'>{userInfo?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label='电话'>{userInfo?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label='部门'>{userInfo?.departmentName || '-'}</Descriptions.Item>
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
