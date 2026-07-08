import {
  reqCreatePermissionRole,
  reqUpdatePermissionRole,
} from '@/apis';
import { MyModal } from '@/components';
import { Status, STATUS_OPTIONS } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type {
  CreatePermissionRoleParams,
  PermissionRoleItem,
} from '@/types/permission';
import { msgError, msgSuccess } from '@/utils/modal';
import { Form, Input, Select } from 'antd';
import { forwardRef } from 'react';
import styles from './index.module.less';

function RoleFormModal(props: Props, ref: React.ForwardedRef<Ref<void, PermissionRoleItem | void>>) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<PermissionRoleItem | null>(null);
  const isEdit = !!editingRecord;

  const { visible, close } = useVisible(
    {
      onOpen: (record?: PermissionRoleItem) => {
        setEditingRecord(record ?? null);
        if (record) {
          formRef.setFieldsValue({
            name: record.name,
            code: record.code,
            description: record.description || undefined,
            status: record.status,
            remark: record.remark || undefined,
          });
        } else {
          formRef.setFieldsValue({ status: Status.NORMAL });
        }
      },
      onReset: () => {
        formRef.resetFields();
        setEditingRecord(null);
      },
    },
    ref,
  );

  const handleSave = async () => {
    try {
      const values = await formRef.validateFields();
      const payload: CreatePermissionRoleParams = {
        ...values,
        description: values.description || undefined,
        remark: values.remark || undefined,
      };
      const res = isEdit
        ? await reqUpdatePermissionRole(editingRecord!.id, payload)
        : await reqCreatePermissionRole(payload);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess(isEdit ? '更新成功' : '创建成功');
      close();
      await onSuccess?.();
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <MyModal
      title={isEdit ? '编辑角色' : '新建角色'}
      open={visible}
      onOk={handleSave}
      onCancel={close}
      width={640}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <div className={styles['formGrid']}>
          <Form.Item
            label='角色名称'
            name='name'
            rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder='请输入角色名称' />
          </Form.Item>
          <Form.Item
            label='角色编码'
            name='code'
            rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder='请输入角色编码' disabled={isEdit} />
          </Form.Item>
          <Form.Item
            label='状态'
            name='status'
            rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={STATUS_OPTIONS} placeholder='请选择状态' />
          </Form.Item>
          <Form.Item label='描述' name='description' className={styles['fullWidth']}>
            <Input.TextArea placeholder='请输入描述' rows={3} showCount maxLength={200} />
          </Form.Item>
          <Form.Item label='备注' name='remark' className={styles['fullWidth']}>
            <Input.TextArea placeholder='请输入备注' rows={2} showCount maxLength={500} />
          </Form.Item>
        </div>
      </Form>
    </MyModal>
  );
}

export default forwardRef(RoleFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
