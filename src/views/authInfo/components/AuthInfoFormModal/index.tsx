import { reqCreateAuthInfo, reqUpdateAuthInfo } from '@/apis/authManagement';
import { MyModal } from '@/components';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { AuthInfoListItem, AuthPlatform } from '@/types/authInfo';
import { msgSuccess } from '@/utils/modal';
import { Form, Input, Radio } from 'antd';
import type { RuleObject } from 'antd/es/form';
import { forwardRef } from 'react';
import { AUTH_PLATFORM_OPTIONS } from '../../constants';
import { normalizeText, parseAuthInfoJson, stringifyAuthInfoJson } from '../../utils';
import styles from './index.module.less';

const AUTH_JSON_PLACEHOLDER = `{
  "cookie": ""
}`;

/**
 * 校验认证 JSON 文本是否合法
 * @example
 * ```ts
 * await validateAuthInfoJson(_, '{"cookie":"a=1"}');
 * ```
 */
const validateAuthInfoJson: RuleObject['validator'] = async (_, value?: string) => {
  parseAuthInfoJson(value);
};

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
        formRef.setFieldsValue({
          platform: record?.platform || 'qishui',
          name: record?.name || undefined,
          remark: record?.remark || undefined,
          authInfoText: stringifyAuthInfoJson(record?.authInfo, ['name']),
        });
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
      const payload = {
        platform: (values.platform || 'qishui') as AuthPlatform,
        authInfo: {
          ...parseAuthInfoJson(values.authInfoText),
          name: normalizeText(values.name),
        },
        remark: normalizeText(values.remark) ,
      };

      if (isEdit) {
        const res = await reqUpdateAuthInfo(editingRecord!.id, payload);
        if (res.code === 200) {
          msgSuccess('更新成功');
        }
      } else {
        const res = await reqCreateAuthInfo(payload);
        if (res.code === 200) {
          msgSuccess('创建成功');
        }
      }

      await onSuccess?.();
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
        <Form.Item
          label='平台'
          name='platform'
          rules={[{ required: true, message: '请选择平台' }]}>
          <Radio.Group options={AUTH_PLATFORM_OPTIONS} optionType='button' buttonStyle='solid' />
        </Form.Item>
        <Form.Item
          label='名称'
          name='name'
          rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder='例如：主号认证、备用认证' allowClear maxLength={100} />
        </Form.Item>
        <Form.Item
          label='认证 JSON'
          name='authInfoText'
          required
          rules={[{ validator: validateAuthInfoJson }]}
          extra='只校验 JSON 是否合法，字段由各平台自行约定'>
          <Input.TextArea
            className={styles['jsonInput']}
            placeholder={AUTH_JSON_PLACEHOLDER}
            rows={12}
            allowClear
          />
        </Form.Item>
        <Form.Item label='备注' name='remark'>
          <Input.TextArea
            placeholder='可填写用途、账号归属或补充备注'
            rows={3}
            showCount
            maxLength={300}
            allowClear
          />
        </Form.Item>
      </Form>
    </MyModal>
  );
}

export default forwardRef(AuthInfoFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
