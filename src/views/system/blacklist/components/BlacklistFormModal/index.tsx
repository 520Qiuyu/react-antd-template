import { reqGetLatestIpBlacklist } from '@/apis/ipBlacklist';
import { MyModal } from '@/components';
import SubTitle from '@/components/SubTitle';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type {
  BlacklistDuration,
  BlacklistFormPreset,
  BlacklistFormValues,
  BlacklistListItem,
} from '@/types/blacklist';
import { msgSuccess } from '@/utils/modal';
import { DatePicker, Form, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { forwardRef } from 'react';
import { BLACKLIST_DURATION_OPTIONS } from '../../constants';
import { isValidIpv4 } from '../../utils';
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
 * 计算距离过期还剩多久
 * @example
 * ```ts
 * formatRemainTime(dayjs().add(90, 'second')) // '剩余 1分钟30秒'
 * formatRemainTime(dayjs().subtract(1, 'minute')) // '已过期'
 * ```
 */
const formatRemainTime = (expireAt: dayjs.Dayjs, now = dayjs()) => {
  const diff = expireAt.diff(now);
  if (diff <= 0) return '已过期';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const parts = [
    days ? `${days}天` : '',
    hours ? `${hours}小时` : '',
    minutes ? `${minutes}分钟` : '',
    `${seconds}秒`,
  ].filter(Boolean);
  return `剩余 ${parts.join('')}`;
};

/**
 * 黑名单新建 / 编辑弹窗
 * @example
 * ```tsx
 * <BlacklistFormModal ref={formModalRef} onSuccess={handleSuccess} />
 * formModalRef.current?.open();
 * formModalRef.current?.open({ ip: '1.1.1.1', reason: '解析日志拉黑' });
 * formModalRef.current?.open(record);
 * ```
 */
function BlacklistFormModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, BlacklistListItem | BlacklistFormPreset | void>>,
) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<BlacklistListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const duration = Form.useWatch('duration', formRef) as BlacklistDuration | undefined;
  const customExpireAt = Form.useWatch('customExpireAt', formRef);
  const [now, setNow] = useState(() => dayjs());
  const isEdit = !!editingRecord;
  const remainText =
    duration === 'custom' && customExpireAt ? formatRemainTime(dayjs(customExpireAt), now) : '';

  const { visible, close } = useVisible(
    {
      onOpen: (payload?: BlacklistListItem | BlacklistFormPreset) => {
        const record = payload && 'id' in payload ? payload : null;
        const preset = payload && !('id' in payload) ? payload : undefined;
        setEditingRecord(record);
        if (record) {
          const isPermanent = record.expireAt == null;
          formRef.setFieldsValue({
            ip: record.ip,
            duration: isPermanent ? 'permanent' : 'custom',
            customExpireAt: isPermanent ? undefined : dayjs(record.expireAt),
            reason: record.reason,
            remark: record.remark || undefined,
          });
          return;
        }
        formRef.resetFields();
        formRef.setFieldsValue({
          duration: '24h',
          ip: preset?.ip,
          reason: preset?.reason,
          remark: preset?.remark,
        });
        if (preset?.ip && isValidIpv4(preset.ip)) {
          void fillLatestRecord(preset.ip);
        }
      },
      onReset: () => {
        formRef.resetFields();
        setEditingRecord(null);
      },
    },
    ref,
  );

  useEffect(() => {
    if (!visible || duration !== 'custom') return;
    const timer = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, [visible, duration]);

  const fillLatestRecord = async (ip: string) => {
    const normalizedIp = normalizeText(ip);
    if (!isValidIpv4(normalizedIp)) return;
    const res = await reqGetLatestIpBlacklist(normalizedIp);
    if (res.code !== 200 || !res.data) return;
    const latest = res.data;
    const isPermanent = latest.expireAt == null;
    const expireAt = latest.expireAt ? dayjs(latest.expireAt) : null;
    const expireStillValid = !!expireAt && expireAt.isAfter(dayjs());
    formRef.setFieldsValue({
      duration: isPermanent ? 'permanent' : expireStillValid ? 'custom' : '24h',
      customExpireAt: expireStillValid ? expireAt : undefined,
      reason: latest.reason,
      remark: latest.remark || undefined,
    });
  };

  const handleIpBlur = async () => {
    if (editingRecord) return;
    await fillLatestRecord(formRef.getFieldValue('ip'));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const values = await formRef.validateFields();
      const payload: BlacklistFormValues = {
        ip: normalizeText(values.ip),
        duration: values.duration,
        customExpireAt:
          values.duration === 'custom' && values.customExpireAt
            ? dayjs(values.customExpireAt).toISOString()
            : undefined,
        reason: normalizeText(values.reason),
        remark: normalizeText(values.remark) || undefined,
      };

      await onSuccess?.(payload, editingRecord ?? undefined);
      msgSuccess(isEdit ? '更新成功' : '添加成功');
      close();
    } catch (error) {
      console.log('error', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title={isEdit ? '编辑黑名单' : '添加黑名单'}
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={640}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <div className={styles['section']}>
          <SubTitle title='拉黑信息' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item
              label='IP 地址'
              name='ip'
              rules={[
                { required: true, message: '请输入 IP 地址' },
                {
                  validator: async (_, value) => {
                    if (!value) return;
                    if (!isValidIpv4(value)) {
                      throw new Error('请输入合法的 IPv4 地址');
                    }
                  },
                },
              ]}
              className={styles['ipField']}>
              <Input placeholder='例如：203.0.113.88' allowClear onBlur={handleIpBlur} />
            </Form.Item>

            <Form.Item
              label='拉黑时长'
              name='duration'
              rules={[{ required: true, message: '请选择拉黑时长' }]}
              className={styles['durationField']}>
              <Select
                options={BLACKLIST_DURATION_OPTIONS}
                placeholder='请选择拉黑时长'
                onChange={(value: BlacklistDuration) => {
                  if (value !== 'custom') {
                    formRef.setFieldValue('customExpireAt', undefined);
                  }
                }}
              />
            </Form.Item>

            {duration === 'custom' ? (
              <Form.Item
                label={
                  <span className={styles['expireLabel']}>
                    自定义过期时间
                    {remainText ? (
                      <span
                        className={
                          remainText === '已过期' ? styles['remainExpired'] : styles['remainText']
                        }
                        aria-live='polite'>
                        {remainText}
                      </span>
                    ) : null}
                  </span>
                }
                name='customExpireAt'
                rules={[
                  { required: true, message: '请选择过期时间' },
                  {
                    validator: async (_, value) => {
                      if (!value) return;
                      if (!dayjs(value).isAfter(dayjs())) {
                        throw new Error('过期时间必须晚于当前时间');
                      }
                    },
                  },
                ]}
                className={styles['fullWidth']}>
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder='请选择过期时间'
                  disabledDate={(current) => !!current && current.isBefore(dayjs().startOf('day'))}
                />
              </Form.Item>
            ) : null}

            <Form.Item
              label='拉黑原因'
              name='reason'
              rules={[
                { required: true, message: '请输入拉黑原因' },
                { max: 200, message: '拉黑原因最多 200 字' },
              ]}
              className={styles['fullWidth']}>
              <Input.TextArea
                placeholder='例如：恶意下单、请求频率过高'
                rows={3}
                showCount
                maxLength={200}
                allowClear
              />
            </Form.Item>
          </div>
        </div>

        <div className={styles['section']}>
          <SubTitle title='补充说明' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item
              label='备注'
              name='remark'
              rules={[{ max: 200, message: '备注最多 200 字' }]}
              className={styles['fullWidth']}>
              <Input.TextArea
                placeholder='可填写关联订单、平台 ID 等'
                rows={3}
                showCount
                maxLength={200}
                allowClear
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </MyModal>
  );
}

export default forwardRef(BlacklistFormModal);

interface Props {
  onSuccess?: (
    values: BlacklistFormValues,
    record?: BlacklistListItem,
  ) => unknown | Promise<unknown>;
}
