import { useQuery } from '@/hooks';
import { reqPostLogin, reqPostRegister } from '@/apis/auth';
import type { AuthFormValues, LoginFormValues, RegisterFormValues } from '@/types/auth';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLocalToken, setLocalUserInfo } from '@/utils/userInfo';
import styles from './index.module.less';
import { msgError, msgSuccess } from '@/utils/modal';
import { Status } from '@/constants';

interface LoginQuery {
  callbackUrl?: string;
}

type Mode = 'login' | 'register';

const Login = () => {
  const [formRef] = Form.useForm<AuthFormValues>();
  const { callbackUrl } = useQuery<LoginQuery>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('login');

  const handleSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await reqPostLogin(values);
        if (!res.data) return msgError('登录失败');
        if (res.code === 200) {
          const { accessToken, account } = res.data;
          setLocalToken(accessToken);
          setLocalUserInfo({
            id: String(account),
            account,
            status: Status.NORMAL,
          });
          msgSuccess('登录成功');
          if (callbackUrl) {
            navigate(decodeURIComponent(callbackUrl), { replace: true });
          } else {
            navigate('/', { replace: true });
          }
          return;
        }
      } /* else {
        const res = await reqPostRegister(values);
        if (res.code !== 200) return msgError(res.message);
        msgSuccess('注册成功，请登录');
        setMode('login');
      } */
    } catch (error) {
      console.error(mode === 'login' ? '登录失败：' : '注册失败：', error);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setLoading(false);
    formRef.resetFields();
  };

  const isLogin = mode === 'login';

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

      <section className={styles['form-panel']} aria-label={isLogin ? '登录表单' : '注册表单'}>
        <div className={styles['login-card']}>
          <div className={styles['login-header']}>
            <span className={styles['login-mark']}>M</span>
            <h2>{isLogin ? '登录管理后台' : '注册管理后台'}</h2>
            <p>{isLogin ? '请输入账号密码继续访问' : '创建账号后即可登录系统'}</p>
          </div>

          <Form
            form={formRef}
            layout='vertical'
            initialValues={{ remember: true }}
            onFinish={handleSubmit}
            className={styles['login-form']}>
            {isLogin ? (
              <>
                <Form.Item
                  label='账号'
                  name='account'
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
                  {/* <Button
                    type='link'
                    className={styles['switch-button']}
                    onClick={() => switchMode('register')}>
                    去注册
                  </Button> */}
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
              </>
            ) : (
              <>
                <Form.Item
                  label='账号'
                  name='account'
                  rules={[
                    { required: true, message: '请输入账号' },
                    { min: 5, message: '账号长度不能少于 5 位' },
                  ]}>
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
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码长度不能少于 6 位' },
                  ]}>
                  <Input.Password
                    size='large'
                    prefix={<LockOutlined />}
                    placeholder='请输入密码'
                    aria-label='密码'
                  />
                </Form.Item>

                <Form.Item
                  label='确认密码'
                  name='confirmPassword'
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}>
                  <Input.Password
                    size='large'
                    prefix={<LockOutlined />}
                    placeholder='请再次输入密码'
                    aria-label='确认密码'
                  />
                </Form.Item>

                <div className={styles['form-extra']}>
                  <span className={styles['switch-tip']}>已有账号？</span>
                  <Button
                    type='link'
                    className={styles['switch-button']}
                    onClick={() => switchMode('login')}>
                    去登录
                  </Button>
                </div>

                <Button
                  block
                  size='large'
                  type='primary'
                  htmlType='submit'
                  loading={loading}
                  className={styles['submit-button']}>
                  注册
                </Button>
              </>
            )}
          </Form>
        </div>
      </section>
    </main>
  );
};

export default Login;
