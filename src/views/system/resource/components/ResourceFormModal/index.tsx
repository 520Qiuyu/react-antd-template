import {
  reqCreatePermissionResource,
  reqUpdatePermissionResource,
} from '@/apis';
import { MyModal } from '@/components';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type {
  CreatePermissionResourceParams,
  PermissionResourceItem,
  PermissionResourceMethod,
  PermissionResourceType,
} from '@/types/permission';
import { msgError, msgSuccess } from '@/utils/modal';
import { Form, Input, Select } from 'antd';
import { forwardRef } from 'react';
import styles from './index.module.less';

const TYPE_OPTIONS = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
  { label: '接口', value: 'api' },
];

const METHOD_OPTIONS: { label: string; value: PermissionResourceMethod }[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'OPTIONS', value: 'OPTIONS' },
  { label: 'HEAD', value: 'HEAD' },
];

function ResourceFormModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, PermissionResourceItem | void>>,
) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<PermissionResourceItem | null>(null);
  const isEdit = !!editingRecord;
  const resourceType = Form.useWatch('type', formRef) as PermissionResourceType | undefined;

  const { visible, close } = useVisible(
    {
      onOpen: (record?: PermissionResourceItem) => {
        setEditingRecord(record ?? null);
        if (record) {
          formRef.setFieldsValue({
            name: record.name,
            code: record.code,
            type: record.type,
            parentId: record.parentId || undefined,
            url: record.url || undefined,
            method: record.method || undefined,
            remark: record.remark || undefined,
          });
        } else {
          formRef.setFieldsValue({ type: 'api' });
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
      const payload: CreatePermissionResourceParams = {
        ...values,
        parentId: values.parentId || undefined,
        url: values.type === 'api' ? values.url || undefined : values.url || undefined,
        method: values.type === 'api' ? values.method || undefined : undefined,
        remark: values.remark || undefined,
      };
      const res = isEdit
        ? await reqUpdatePermissionResource(editingRecord!.id, payload)
        : await reqCreatePermissionResource(payload);
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
      title={isEdit ? '编辑资源' : '新建资源'}
      open={visible}
      onOk={handleSave}
      onCancel={close}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <Form.Item label='资源名称' name='name' rules={[{ required: true, message: '请输入资源名称' }]}>
          <Input placeholder='请输入资源名称' />
        </Form.Item>
        <Form.Item label='资源编码' name='code' rules={[{ required: true, message: '请输入资源编码' }]}>
          <Input placeholder='请输入资源编码' disabled={isEdit} />
        </Form.Item>
        <Form.Item label='资源类型' name='type' rules={[{ required: true, message: '请选择资源类型' }]}>
          <Select options={TYPE_OPTIONS} placeholder='请选择资源类型' />
        </Form.Item>
        <Form.Item label='父级 ID' name='parentId'>
          <Input placeholder='请输入父级资源 ID（可选）' />
        </Form.Item>
        {resourceType === 'api' && (
          <>
            <Form.Item label='URL' name='url'>
              <Input placeholder='请输入接口路径' />
            </Form.Item>
            <Form.Item label='请求方法' name='method'>
              <Select allowClear options={METHOD_OPTIONS} placeholder='请选择请求方法' />
            </Form.Item>
          </>
        )}
        {resourceType === 'menu' && (
          <Form.Item label='路由路径' name='url'>
            <Input placeholder='请输入菜单路由路径' />
          </Form.Item>
        )}
        <Form.Item label='备注' name='remark'>
          <Input.TextArea placeholder='请输入备注' rows={2} />
        </Form.Item>
      </Form>
    </MyModal>
  );
}

export default forwardRef(ResourceFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
