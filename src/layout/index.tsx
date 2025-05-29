import AuthGuard from '@/components/AuthGuard';
import { Layout } from 'antd';
import Footer from './components/Footer';
import Header from './components/Header';
import Sider from './components/Sider';
import styles from './index.module.less';
import Main from './components/Main';

const { Content } = Layout;

export default function MainLayout() {
  return (
    <Layout className={styles['main-layout']}>
      <Header />
      <Layout>
        <Sider />
        <Content className={styles['content-wrapper']}>
          <Main />
          <Footer />
        </Content>
      </Layout>
    </Layout>
  );
}
