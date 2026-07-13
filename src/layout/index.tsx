import { useCurrentRoute } from '@/hooks';
import { Layout } from 'antd';
import Footer from './components/Footer';
import Header from './components/Header';
import Main from './components/Main';
import Sider from './components/Sider';
import styles from './index.module.less';

const { Content } = Layout;

export default function MainLayout() {
  const routeInfo = useCurrentRoute();
  const { hiddenLayout } = routeInfo || {};

  return hiddenLayout ? (
    <Main />
  ) : (
    <Layout className={styles['main-layout']}>
      <Header />
      <Layout>
        <Sider />
        <Content className={styles['content-wrapper']}>
          <Main />
          {/* <Footer /> */}
        </Content>
      </Layout>
    </Layout>
  );
}
