import { reqCreateCardSecret, reqUpdateCardSecret } from '@/apis/qishui/cardSecret';
import { MyModal } from '@/components';
import SubTitle from '@/components/SubTitle';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { CardSecretFormValues, CardSecretListItem, CardSecretType } from '@/types/cardSecret';
import { msgError, msgSuccess } from '@/utils/modal';
import { DatePicker, Form, Input, InputNumber, Radio, Slider } from 'antd';
import dayjs from 'dayjs';
import { forwardRef } from 'react';
import { CARD_SECRET_TYPE_OPTIONS } from '../../constants';
import styles from './index.module.less';

const DEFAULT_CREATE_COUNT = 1;
const DEFAULT_PARSE_LIMIT = 100;
const CREATE_COUNT_MARKS = { 1: '1', 25: '25', 50: '50', 75: '75', 100: '100' };

const normalizeOptionalText = (value?: string) => {
  const text = value?.trim();
  return text || undefined;
};

function CardSecretFormModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, CardSecretListItem | void>>,
) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<CardSecretListItem | null>(null);
  const isEdit = !!editingRecord;
  const cardType = Form.useWatch('type', formRef) as CardSecretType | undefined;

  const { visible, close } = useVisible(
    {
      onOpen: (record?: CardSecretListItem) => {
        setEditingRecord(record ?? null);
        if (record) {
          const { type, expireTime, parseLimit, authInfo } = record;
          const { deviceId, cookie, xHelios, xMedusa } = authInfo ?? {};
          formRef.setFieldsValue({
            type,
            expireTime: expireTime ? dayjs(expireTime) : undefined,
            parseLimit: parseLimit || DEFAULT_PARSE_LIMIT,
            deviceId,
            cookie,
            xHelios,
            xMedusa,
          });
        } else {
          formRef.setFieldsValue({
            createCount: DEFAULT_CREATE_COUNT,
            type: 'time',
            parseLimit: DEFAULT_PARSE_LIMIT,
          });
        }
      },
      onReset: () => {
        formRef.resetFields();
        setEditingRecord(null);
      },
    },
    ref,
  );

  const [submitting, setSubmitting] = useState(false);

  /**
   * 解析认证信息：齐全则返回对象，全空返回 null，部分填写返回 false（非法）
   */
  const resolveAuthInfo = (values: Record<string, any>) => {
    const normalizedAuth = {
      deviceId: normalizeOptionalText(values.deviceId),
      cookie: normalizeOptionalText(values.cookie),
      xHelios: normalizeOptionalText(values.xHelios),
      xMedusa: normalizeOptionalText(values.xMedusa),
    };
    const filledCount = Object.values(normalizedAuth).filter(Boolean).length;
    if (filledCount === 0) return null;
    if (filledCount < 4) return false;
    return {
      deviceId: normalizedAuth.deviceId!,
      cookie: normalizedAuth.cookie!,
      xHelios: normalizedAuth.xHelios!,
      xMedusa: normalizedAuth.xMedusa!,
    };
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const values = await formRef.validateFields();
      const authInfo = resolveAuthInfo(values);
      if (authInfo === false) {
        msgError('认证信息需四项全部填写，或全部留空');
        return;
      }

      const payload: CardSecretFormValues = {
        createCount: isEdit ? 1 : values.createCount,
        type: values.type,
        expireTime: values.type === 'time' ? (values.expireTime?.toISOString() ?? null) : null,
        parseLimit:
          values.type === 'count' ? (values.parseLimit ?? DEFAULT_PARSE_LIMIT) : undefined,
        authInfo: authInfo ?? undefined,
      };

      if (isEdit) {
        const res = await reqUpdateCardSecret(editingRecord!.id, {
          type: payload.type,
          expireTime: payload.expireTime,
          parseLimit: payload.parseLimit,
          // null 表示清空认证信息；有对象则更新
          authInfo: authInfo,
        });
        if (res.code !== 200) return msgError(res.message);
        msgSuccess('更新成功');
      } else {
        const res = await reqCreateCardSecret({
          createCount: payload.createCount,
          type: payload.type,
          expireTime: payload.expireTime,
          parseLimit: payload.parseLimit,
          authInfo: payload.authInfo,
        });
        if (res.code !== 200) return msgError(res.message);
        msgSuccess(`创建成功（${res.data?.count ?? payload.createCount} 条）`);
      }

      close();
      await onSuccess?.();
    } catch (error) {
      console.log('error', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title={isEdit ? '编辑卡密' : '新建卡密'}
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={720}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <div className={styles['section']}>
          <SubTitle title='基础信息' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            {!isEdit && (
              <Form.Item label='创建数量' required className={styles['fullWidth']}>
                <div className={styles['sliderRow']}>
                  <Form.Item
                    name='createCount'
                    noStyle
                    rules={[{ required: true, message: '请选择创建数量' }]}>
                    <Slider min={1} max={100} marks={CREATE_COUNT_MARKS} />
                  </Form.Item>
                  <Form.Item
                    name='createCount'
                    noStyle
                    rules={[{ required: true, message: '请选择创建数量' }]}>
                    <InputNumber min={1} max={100} className={styles['sliderInput']} />
                  </Form.Item>
                </div>
              </Form.Item>
            )}
            <Form.Item label='类型' name='type' rules={[{ required: true, message: '请选择类型' }]}>
              <Radio.Group
                options={CARD_SECRET_TYPE_OPTIONS}
                optionType='button'
                buttonStyle='solid'
              />
            </Form.Item>
            {cardType === 'time' ? (
              <Form.Item
                label='结束时间'
                name='expireTime'
                initialValue={dayjs().add(1, 'day')}
                rules={[{ required: true, message: '请选择结束时间' }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder='例如：2026-12-31 23:59:59'
                  disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                  format='YYYY-MM-DD HH:mm:ss'
                  showTime={false}
                  // 快捷方式，一天，七天，一个月，半年
                  presets={[
                    {
                      label: '一天',
                      value: dayjs().add(1, 'day'),
                    },
                    {
                      label: '七天',
                      value: dayjs().add(7, 'day'),
                    },
                    {
                      label: '一个月',
                      value: dayjs().add(1, 'month'),
                    },
                    {
                      label: '三个月',
                      value: dayjs().add(3, 'month'),
                    },
                    {
                      label: '半年',
                      value: dayjs().add(6, 'month'),
                    },
                    {
                      label: '一年',
                      value: dayjs().add(1, 'year'),
                    },
                  ]}
                />
              </Form.Item>
            ) : (
              <Form.Item
                label='可解析数量'
                name='parseLimit'
                rules={[{ required: true, message: '请输入可解析数量' }]}>
                <InputNumber
                  min={1}
                  max={99999}
                  style={{ width: '100%' }}
                  placeholder='例如：100'
                />
              </Form.Item>
            )}
          </div>
        </div>

        <div className={styles['section']}>
          <SubTitle title='认证信息' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item label='Device ID' name='deviceId' className={styles['fullWidth']}>
              <Input placeholder='例如：device-xxxx-001' allowClear />
            </Form.Item>
            <Form.Item label='Cookie' name='cookie' className={styles['fullWidth']}>
              <Input.TextArea
                placeholder='例如：sessionid=xxx; uid=xxx'
                rows={3}
                showCount
                maxLength={2000}
                allowClear
              />
            </Form.Item>
            <Form.Item label='X-Helios' name='xHelios'>
              <Input.TextArea
                placeholder='例如：helios token'
                rows={3}
                showCount
                maxLength={2000}
                allowClear
              />
            </Form.Item>
            <Form.Item label='X-Medusa' name='xMedusa'>
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
      </Form>
    </MyModal>
  );
}

export default forwardRef(CardSecretFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
