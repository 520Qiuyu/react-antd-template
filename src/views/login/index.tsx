import loginBg from '@/assets/images/login_bg.png';
import loginLogo from '@/assets/images/login_logo.png';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Form, Input } from 'antd';
import { useState } from 'react';
import codePng from './code.png';
import styles from './index.module.less';

const Login = () => {
  const [formRef] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      console.log('登录信息：', values);
      // TODO: 实现登录逻辑
    } catch (error) {
      console.error('登录失败：', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['login-container']}>
      {/* 背景图片 */}
      <img src={loginBg} alt='login-bg' className={styles['login-bg']} />

      <Card className={styles['login-card']}>
        <div className={styles['login-header']}>
          <img src={loginLogo} alt='logo' className={styles['login-logo']} />
          <h2>欢迎登录系统</h2>
        </div>
        <Form
          form={formRef}
          onFinish={handleSubmit}
          layout='horizontal'
          colon={false}
          className={styles['form']}
          wrapperCol={{
            flex: 1,
          }}>
          <Form.Item name='username' rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} size='large' placeholder='请输入用户名' />
          </Form.Item>
          <Form.Item name='password' rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} size='large' placeholder={'请输入密码'} />
          </Form.Item>
          <Form.Item
            name='captcha'
            label={<img src={codePng} />}
            required={false}
            rules={[{ required: true, message: '请输入验证码' }]}>
            <Input size='large' placeholder='请输入验证码' style={{ flex: 1 }} />
          </Form.Item>
          <div className={styles['operation']}>
            <Form.Item name='remember' noStyle valuePropName='checked'>
              <Checkbox>记住密码</Checkbox>
            </Form.Item>
            <a href='#'>忘记密码</a>
          </div>

          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              block
              size='large'
              style={{
                borderRadius: 4,
              }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
