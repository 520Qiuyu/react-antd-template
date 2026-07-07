import { reqPutUserInfo } from '@/apis';
import { MyModal } from '@/components';
import { Gender } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { UpdateUserInfoParams } from '@/types/user';
import { msgError, msgSuccess } from '@/utils/modal';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, DatePicker, Form, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { forwardRef } from 'react';

function EditUserInfoModal(props: Props, ref: React.ForwardedRef<Ref<void, void>>) {
  const { userInfo, onSuccess } = props;
  const [formRef] = Form.useForm();
  const { visible, close } = useVisible(
    {
      onOpen: () => {
        formRef.setFieldsValue({
          nickname: userInfo?.nickname || undefined,
          avatar: userInfo?.avatar || undefined,
          email: userInfo?.email || undefined,
          phone: userInfo?.phone || undefined,
          wechat: userInfo?.wechat || undefined,
          qq: userInfo?.qq || undefined,
          gender: userInfo?.gender || undefined,
          birthday: userInfo?.birthday ? dayjs(userInfo.birthday) : undefined,
        });
      },
    },
    ref,
  );

  const handleSave = async () => {
    try {
      const values = await formRef.validateFields();
      const payload: UpdateUserInfoParams = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
      };
      const res = await reqPutUserInfo(payload);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('修改成功');
      close();
      await onSuccess?.();
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <MyModal title='修改个人信息' open={visible} onOk={handleSave} onCancel={close}>
      <Form form={formRef} layout='vertical'>
        <Form.Item label='头像'>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar
              size={72}
              src={Form.useWatch('avatar', formRef)}
              icon={<UserOutlined />}
              shape='circle'
            />
            <Form.Item name='avatar' noStyle>
              <Input
                placeholder='请输入头像 URL'
                style={{
                  flex: 1,
                }}
              />
            </Form.Item>
          </div>
        </Form.Item>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0 24px',
          }}>
          <Form.Item label='昵称' name='nickname'>
            <Input placeholder='请输入昵称' />
          </Form.Item>
          <Form.Item label='邮箱' name='email'>
            <Input placeholder='请输入邮箱' />
          </Form.Item>
          <Form.Item label='电话' name='phone'>
            <Input placeholder='请输入电话' />
          </Form.Item>
          <Form.Item label='微信' name='wechat'>
            <Input placeholder='请输入微信号' />
          </Form.Item>
          <Form.Item label='QQ' name='qq'>
            <Input placeholder='请输入 QQ 号' />
          </Form.Item>
          <Form.Item label='性别' name='gender'>
            <Select
              allowClear
              placeholder='请选择性别'
              options={[
                { label: '男', value: Gender.MALE },
                { label: '女', value: Gender.FEMALE },
                { label: '未知', value: Gender.UNKNOWN },
              ]}
            />
          </Form.Item>
          <Form.Item label='生日' name='birthday'>
            <DatePicker style={{ width: '100%' }} placeholder='请选择生日' />
          </Form.Item>
        </div>
      </Form>
    </MyModal>
  );
}

export default forwardRef(EditUserInfoModal);

interface Props {
  userInfo?: UserInfo | null;
  onSuccess?: () => unknown | Promise<unknown>;
}
