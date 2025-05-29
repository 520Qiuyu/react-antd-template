import logo from '@/assets/images/logo.png';
import { BellOutlined } from '@ant-design/icons';
import { Badge, Divider } from 'antd';
import styles from './index.module.less';
import UserInfo from './UserInfo';

export default function Header() {
  return (
    <div className={styles['header']}>
      {/* 左边 */}
      <div className={styles['left']}>
        {/* logo */}
        <div className={styles['logo-wrapper']}>
          <img src={logo} alt='中山大学' className={styles['logo']} />
        </div>
        <Divider type='vertical' className={styles['divider']} />
        {/* title */}
        <div className={styles['title']}>运营平台</div>
      </div>
      {/* 右边 */}
      <div className={styles['right']}>
        {/* 铃铛 */}
        <div className={styles['bell']}>
          <Badge count={5} size='small'>
            <BellOutlined
              style={{
                fontSize: 20,
                color: '#fff',
              }}
            />
          </Badge>
        </div>
        {/* 用户 */}
        <UserInfo />
      </div>
    </div>
  );
}
