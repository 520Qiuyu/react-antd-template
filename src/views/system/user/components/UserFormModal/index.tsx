import { reqCreateUser, reqUpdateUser } from '@/apis';
import { MyModal } from '@/components';
import { Gender, GENDER_OPTIONS, Status, STATUS_OPTIONS } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { AdminUpdateUserParams, CreateUserParams, UserListItem } from '@/types/user';
import { msgError, msgSuccess } from '@/utils/modal';
import { Avatar, DatePicker, Form, Input, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { forwardRef } from 'react';
import styles from './index.module.less';

function UserFormModal(props: Props, ref: React.ForwardedRef<Ref<void, UserListItem | void>>) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<UserListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editingRecord;

  const { visible, close } = useVisible(
    {
      onOpen: (record?: UserListItem) => {
        setEditingRecord(record ?? null);
        if (record) {
          setFormValues(record);
        } else {
          formRef.resetFields();
          formRef.setFieldsValue({ status: Status.NORMAL, gender: Gender.UNKNOWN });
        }
      },
      onReset: () => {
        formRef.resetFields();
        setEditingRecord(null);
      },
    },
    ref,
  );

  const setFormValues = (data: UserListItem) => {
    formRef.setFieldsValue({
      account: data.account,
      nickname: data.nickname || undefined,
      avatar: data.avatar || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      wechat: data.wechat || undefined,
      qq: data.qq || undefined,
      gender: data.gender || undefined,
      birthday: data.birthday ? dayjs(data.birthday) : undefined,
      status: data.status === Status.DELETED ? Status.NORMAL : data.status,
    });
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const values = await formRef.validateFields();
      const profilePayload = {
        nickname: values.nickname || undefined,
        avatar: values.avatar || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        wechat: values.wechat || undefined,
        qq: values.qq || undefined,
        gender: values.gender || undefined,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
        status: values.status,
      };

      if (isEdit) {
        const payload: AdminUpdateUserParams = {
          ...profilePayload,
          ...(values.password ? { password: values.password } : {}),
        };
        const res = await reqUpdateUser(editingRecord!.id, payload);
        if (res.code !== 200) return msgError(res.message);
        msgSuccess('更新成功');
        close();
        await onSuccess?.();
      } else {
        const payload: CreateUserParams = {
          account: values.account,
          password: values.password,
          ...profilePayload,
        };
        const res = await reqCreateUser(payload);
        if (res.code === 200) {
          msgSuccess('创建成功');
          close();
          await onSuccess?.();
        }
      }
    } catch (error) {
      console.log('error', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title={isEdit ? '编辑用户' : '新建用户'}
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={760}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <div className={styles['formGrid']}>
          <Form.Item
            label='账号'
            name='account'
            rules={[{ required: !isEdit, message: '请输入账号' }]}>
            <Input placeholder='请输入账号' disabled={isEdit} />
          </Form.Item>
          <Form.Item
            label={isEdit ? '新密码' : '密码'}
            name='password'
            rules={
              isEdit
                ? [{ min: 6, message: '密码至少 6 位' }]
                : [
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少 6 位' },
                  ]
            }>
            <Input.Password placeholder={isEdit ? '不修改请留空' : '请输入密码'} />
          </Form.Item>
          <Form.Item label='昵称' name='nickname'>
            <Input placeholder='请输入昵称' />
          </Form.Item>
          <Form.Item label='状态' name='status' rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={STATUS_OPTIONS} placeholder='请选择状态' />
          </Form.Item>
          <Form.Item label='邮箱' name='email'>
            <Input placeholder='请输入邮箱' />
          </Form.Item>
          <Form.Item label='手机号' name='phone'>
            <Input placeholder='请输入手机号' />
          </Form.Item>
          <Form.Item label='微信' name='wechat'>
            <Input placeholder='请输入微信号' />
          </Form.Item>
          <Form.Item label='QQ' name='qq'>
            <Input placeholder='请输入 QQ 号' />
          </Form.Item>
          <Form.Item label='性别' name='gender'>
            <Select allowClear options={GENDER_OPTIONS} placeholder='请选择性别' />
          </Form.Item>
          <Form.Item label='生日' name='birthday'>
            <DatePicker style={{ width: '100%' }} placeholder='请选择生日' />
          </Form.Item>
          <Form.Item shouldUpdate>
            {({ getFieldValue }) => {
              const avatar = getFieldValue('avatar');
              return (
                <Form.Item
                  label={
                    <Space>
                      头像 URL
                      <Avatar src={avatar} size={24} />
                    </Space>
                  }
                  name='avatar'
                  className={styles['fullWidth']}>
                  <Input placeholder='请输入头像 URL' />
                </Form.Item>
              );
            }}
          </Form.Item>
        </div>
      </Form>
    </MyModal>
  );
}

export default forwardRef(UserFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
