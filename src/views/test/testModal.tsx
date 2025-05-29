import { MyModal } from '@/components';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { Button } from 'antd';
import { useState } from 'react';

export default function TestModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const testMessage = () => {
    msgSuccess('hello');
  };

  const testConfirm = async () => {
    try {
      await confirm('确定吗？？？？', '提示');
      msgSuccess('确定了');
    } catch (error) {
      msgError('取消了');
    }
  };
  return (
    <div style={{ display: 'flex', gap: 16, padding: '20px' }}>
      {/* 测试弹窗 */}
      <Button type='primary' onClick={showModal}>
        打开弹窗
      </Button>
      <MyModal title='测试弹窗' open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <p>这是一个测试弹窗内容</p>
      </MyModal>

      {/* 测试message */}
      <Button type='primary' onClick={testMessage}>
        打开Mesage
      </Button>

      {/* 测试confirm */}
      <Button type='primary' onClick={testConfirm}>
        打开确认框
      </Button>
    </div>
  );
}
