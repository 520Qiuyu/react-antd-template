import { Button, Result } from 'antd';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: FC = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div
      style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status='403'
        title='401'
        subTitle='抱歉，您没有访问该页面的权限'
        extra={
          <Button type='primary' onClick={handleBackHome}>
            返回首页
          </Button>
        }
      />
    </div>
  );
};

export default UnauthorizedPage;
