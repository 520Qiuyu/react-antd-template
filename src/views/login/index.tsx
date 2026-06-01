import { useQuery } from '@/hooks';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';
import { useState } from 'react';
import styles from './index.module.less';

interface LoginFormValues {
  username: string;
  password: string;
  remember?: boolean;
}

interface LoginQuery {
  callbackUrl?: string;
}

const Login = () => {
  const [formRef] = Form.useForm<LoginFormValues>();
  const { callbackUrl } = useQuery<LoginQuery>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      console.log('登录信息：', values);
      // TODO 对接登录接口
      if (callbackUrl) {
        navigate(decodeURIComponent(callbackUrl), { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('登录失败：', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles['login-page']}>
      <section className={styles['brand-panel']} aria-label='系统介绍'>
        <div className={styles['brand-content']}>
          <span className={styles['brand-badge']}>Admin Console</span>
          <h1>后台管理系统</h1>

          <div className={styles['dashboard-card']}>
            <div className={styles['dashboard-header']}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles['dashboard-grid']}>
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section className={styles['form-panel']} aria-label='登录表单'>
        <div className={styles['login-card']}>
          <div className={styles['login-header']}>
            <span className={styles['login-mark']}>M</span>
            <h2>登录管理后台</h2>
            <p>请输入账号密码继续访问</p>
          </div>

          <Form
            form={formRef}
            layout='vertical'
            initialValues={{ remember: true }}
            onFinish={handleSubmit}
            className={styles['login-form']}>
            <Form.Item
              label='账号'
              name='username'
              rules={[{ required: true, message: '请输入账号' }]}>
              <Input
                size='large'
                prefix={<UserOutlined />}
                placeholder='请输入账号'
                aria-label='账号'
              />
            </Form.Item>

            <Form.Item
              label='密码'
              name='password'
              rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                size='large'
                prefix={<LockOutlined />}
                placeholder='请输入密码'
                aria-label='密码'
              />
            </Form.Item>

            <div className={styles['form-extra']}>
              <Form.Item name='remember' valuePropName='checked' noStyle>
                <Checkbox>记住密码</Checkbox>
              </Form.Item>
            </div>

            <Button
              block
              size='large'
              type='primary'
              htmlType='submit'
              loading={loading}
              className={styles['submit-button']}>
              登录
            </Button>
          </Form>
        </div>
      </section>
    </main>
  );
};

export default Login;
