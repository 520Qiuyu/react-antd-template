import { MyModal } from '@/components';
import SubTitle from '@/components/SubTitle';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { AuthInfoFormValues, AuthInfoListItem } from '@/types/authInfo';
import { msgSuccess } from '@/utils/modal';
import { Form, Input } from 'antd';
import { forwardRef } from 'react';
import styles from './index.module.less';

/**
 * 规范化必填文本
 * @example
 * ```ts
 * normalizeText('  abc  ') // 'abc'
 * ```
 */
const normalizeText = (value?: string) => value?.trim() || '';

/**
 * 认证信息新建 / 编辑弹窗
 * @example
 * ```tsx
 * <AuthInfoFormModal ref={formModalRef} onSuccess={handleSuccess} />
 * formModalRef.current?.open();
 * formModalRef.current?.open(record);
 * ```
 */
function AuthInfoFormModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, AuthInfoListItem | void>>,
) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<AuthInfoListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editingRecord;

  const { visible, close } = useVisible(
    {
      onOpen: (record?: AuthInfoListItem) => {
        setEditingRecord(record ?? null);
        if (record) {
          formRef.setFieldsValue({
            name: record.name,
            deviceId: record.deviceId,
            cookie: record.cookie,
            xHelios: record.xHelios,
            xMedusa: record.xMedusa,
            remark: record.remark || undefined,
          });
        } else {
          formRef.resetFields();
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
      setSubmitting(true);
      const values = await formRef.validateFields();
      const payload: AuthInfoFormValues = {
        name: normalizeText(values.name),
        deviceId: normalizeText(values.deviceId),
        cookie: normalizeText(values.cookie),
        xHelios: normalizeText(values.xHelios),
        xMedusa: normalizeText(values.xMedusa),
        remark: normalizeText(values.remark) || undefined,
      };

      await onSuccess?.(payload, editingRecord ?? undefined);
      msgSuccess(isEdit ? '更新成功' : '创建成功');
      close();
    } catch (error) {
      console.log('error', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title={isEdit ? '编辑认证信息' : '新建认证信息'}
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={720}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <div className={styles['section']}>
          <SubTitle title='基础信息' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item
              label='名称'
              name='name'
              rules={[{ required: true, message: '请输入名称' }]}
              className={styles['fullWidth']}>
              <Input placeholder='例如：主号认证、备用认证' allowClear />
            </Form.Item>
          </div>
        </div>

        <div className={styles['section']}>
          <SubTitle title='认证配置' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item
              label='Device ID'
              name='deviceId'
              rules={[{ required: true, message: '请输入 Device ID' }]}
              className={styles['fullWidth']}>
              <Input placeholder='例如：device-xxxx-001' allowClear />
            </Form.Item>
            <Form.Item
              label='Cookie'
              name='cookie'
              rules={[{ required: true, message: '请输入 Cookie' }]}
              className={styles['fullWidth']}>
              <Input.TextArea
                placeholder='例如：sessionid=xxx; uid=xxx'
                rows={3}
                showCount
                maxLength={2000}
                allowClear
              />
            </Form.Item>
            <Form.Item
              label='X-Helios'
              name='xHelios'
              rules={[{ required: true, message: '请输入 X-Helios' }]}>
              <Input.TextArea
                placeholder='例如：helios token'
                rows={3}
                showCount
                maxLength={2000}
                allowClear
              />
            </Form.Item>
            <Form.Item
              label='X-Medusa'
              name='xMedusa'
              rules={[{ required: true, message: '请输入 X-Medusa' }]}>
              <Input.TextArea
                placeholder='例如：medusa token'
                rows={3}
                showCount
                maxLength={2000}
                allowClear
              />
            </Form.Item>
          </div>
        </div>

        <div className={styles['section']}>
          <SubTitle title='补充说明' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item label='备注' name='remark' className={styles['fullWidth']}>
              <Input.TextArea
                placeholder='可填写用途、账号归属或补充备注'
                rows={3}
                showCount
                maxLength={300}
                allowClear
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </MyModal>
  );
}

export default forwardRef(AuthInfoFormModal);

interface Props {
  onSuccess?: (
    values: AuthInfoFormValues,
    record?: AuthInfoListItem,
  ) => unknown | Promise<unknown>;
}
