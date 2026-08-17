import { reqCreateCardSecret, reqUpdateCardSecret } from '@/apis/qishui/cardSecret';
import { MyModal } from '@/components';
import SubTitle from '@/components/SubTitle';
import { useUser, useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { CardSecretFormValues, CardSecretListItem, CardSecretType } from '@/types/cardSecret';
import { msgError, msgSuccess } from '@/utils/modal';
import { Form, InputNumber, Radio, Slider } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { forwardRef, useState } from 'react';
import { CARD_SECRET_TYPE_OPTIONS } from '../../constants';
import styles from './index.module.less';
import { getCardSecretValidDays } from '../../utils/cardSecretTime';

const DEFAULT_CREATE_COUNT = 1;
const DEFAULT_PARSE_LIMIT = 100;
const DEFAULT_VALID_DAYS = 30;
const CREATE_COUNT_MARKS = { 1: '1', 25: '25', 50: '50', 75: '75', 100: '100' };

/** 有效期快捷档位，与结束时间预设对齐 */
const VALID_DAYS_PRESETS = [
  { label: '1天', days: 1 },
  { label: '7天', days: 7 },
  { label: '1个月', days: 30 },
  { label: '3个月', days: 90 },
  { label: '半年', days: 180 },
  { label: '1年', days: 365 },
] as const;

const normalizeOptionalText = (value?: string) => {
  const text = value?.trim();
  return text || undefined;
};

function CardSecretFormModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, CardSecretListItem | void>>,
) {
  const { onSuccess } = props;
  const { isSuperAdmin, isAdmin, isProxy } = useUser();
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<CardSecretListItem | null>(null);
  const isEdit = !!editingRecord;
  const cardType = Form.useWatch('type', formRef) as CardSecretType | undefined;
  const expireTimeValue = Form.useWatch('expireTime', formRef);
  const DEFAULT_DAILY_PARSE_LIMIT = isSuperAdmin ? 999999 : isAdmin ? 2000 : 500;

  const { visible, close } = useVisible(
    {
      onOpen: (record?: CardSecretListItem) => {
        setEditingRecord(record ?? null);
        if (record) {
          console.log('record', record);
          const { expireTime, parseLimit, dailyParseLimit, validDays } = record;
          const isCount = record.type === 'count';
          const validDaysValue = getCardSecretValidDays(record);
          formRef.setFieldsValue({
            ...record,
            expireTime: expireTime ? dayjs(expireTime) : undefined,
            validDays: isCount ? undefined : validDaysValue,
            parseLimit: parseLimit || DEFAULT_PARSE_LIMIT,
            dailyParseLimit: dailyParseLimit == null ? undefined : dailyParseLimit,
          });
        } else {
          formRef.setFieldsValue({
            createCount: DEFAULT_CREATE_COUNT,
            type: 'time',
            parseLimit: DEFAULT_PARSE_LIMIT,
            dailyParseLimit: DEFAULT_DAILY_PARSE_LIMIT,
            validDays: DEFAULT_VALID_DAYS,
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
        validDays: values.type === 'time' ? (values.validDays ?? null) : null,
        parseLimit:
          values.type === 'count' ? (values.parseLimit ?? DEFAULT_PARSE_LIMIT) : undefined,
        dailyParseLimit:
          values.type === 'time'
            ? values.dailyParseLimit == null
              ? null
              : values.dailyParseLimit
            : null,
        authInfo: authInfo ?? undefined,
      };

      if (isEdit) {
        const res = await reqUpdateCardSecret(editingRecord!.id, {
          type: payload.type,
          expireTime: payload.expireTime,
          validDays: payload.validDays,
          parseLimit: payload.parseLimit,
          dailyParseLimit: payload.dailyParseLimit,
          // null 表示清空认证信息；有对象则更新
          authInfo: authInfo,
        });
        if (res.code === 200) {
          msgSuccess('更新成功');
        }
      } else {
        const res = await reqCreateCardSecret({
          createCount: payload.createCount,
          type: payload.type,
          expireTime: payload.expireTime,
          validDays: payload.validDays,
          parseLimit: payload.parseLimit,
          dailyParseLimit: payload.dailyParseLimit,
          authInfo: payload.authInfo,
        });
        if (res.code === 200) {
          msgSuccess(`创建成功（${res.data?.count ?? payload.createCount} 条）`);
        }
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
                disabled={isProxy && isEdit}
              />
            </Form.Item>
            {cardType === 'time' ? (
              <>
                <Form.Item
                  label='有效期（天）'
                  name='validDays'
                  tooltip='首次成功解析后开始计算；修改天数不会改写结束时间'
                  dependencies={['expireTime']}
                  rules={[
                    {
                      validator: (_, value) => {
                        const hasExpireTime = Boolean(expireTimeValue);
                        const hasValidDays = value != null && value >= 1;
                        if (!hasExpireTime && !hasValidDays) {
                          return Promise.reject(new Error('请设置结束时间或有效期天数'));
                        }
                        return Promise.resolve();
                      },
                    },
                    {
                      validator: (_, value) => {
                        if (isSuperAdmin) {
                          return Promise.resolve();
                        }
                        if (
                          isEdit &&
                          value &&
                          editingRecord?.validDays &&
                          value < editingRecord.validDays
                        ) {
                          return Promise.reject(new Error('有效期天数不能小于上次天数'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <ValidDaysField
                    minDays={isSuperAdmin ? 1 : isEdit ? editingRecord?.validDays : 1}
                  />
                </Form.Item>
                <Form.Item
                  label='每天最多解析数量'
                  name='dailyParseLimit'
                  extra={
                    isSuperAdmin
                      ? '留空表示不限制每日次数；默认 999999'
                      : '留空表示不限制每日次数；默认 1000'
                  }
                  className={styles['fullWidth']}
                  rules={[
                    { required: !isSuperAdmin, message: '请输入每天最多解析数量' },
                    // 编辑的时候，不能小于上次数量
                    {
                      validator: (_, value) => {
                        if (isSuperAdmin) {
                          return Promise.resolve();
                        }
                        if (
                          isEdit &&
                          value &&
                          editingRecord?.dailyParseLimit &&
                          value < editingRecord?.dailyParseLimit
                        ) {
                          return Promise.reject(new Error('每天最多解析数量不能小于上次数量'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber
                    min={1}
                    max={999999}
                    style={{ width: '100%' }}
                    placeholder='例如：2000，留空不限制'
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                label='可解析数量'
                name='parseLimit'
                rules={[
                  { required: true, message: '请输入可解析数量' },
                  // 编辑的时候，不能小于上次数量
                  {
                    validator: (_, value) => {
                      if (isSuperAdmin) {
                        return Promise.resolve();
                      }
                      if (
                        isEdit &&
                        value &&
                        editingRecord?.parseLimit &&
                        value < editingRecord?.parseLimit
                      ) {
                        return Promise.reject(new Error('可解析数量不能小于上次数量'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
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

        {/*  <div className={styles['section']}>
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
        </div> */}
      </Form>
    </MyModal>
  );
}

export default forwardRef(CardSecretFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}

interface ValidDaysFieldProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  minDays?: number | null;
}

/**
 * 有效期输入：数字框 + 快捷档位
 * @example
 * ```tsx
 * <Form.Item name='validDays'><ValidDaysField minDays={30} /></Form.Item>
 * ```
 */
const ValidDaysField: React.FC<ValidDaysFieldProps> = ({ value, onChange, minDays = 1 }) => {
  const handleNumberChange = (next: number | string | null) => {
    if (typeof next === 'number') {
      onChange?.(next);
      return;
    }
    onChange?.(null);
  };

  const handlePresetClick = (days: number) => {
    onChange?.(days);
  };

  return (
    <div className={styles['validDaysField']}>
      <InputNumber
        min={1}
        max={3650}
        value={value ?? undefined}
        onChange={handleNumberChange}
        style={{ width: '100%' }}
        placeholder='例如：30'
        addonAfter='天'
        aria-label='有效期天数'
      />
      <div className={styles['presets']} role='group' aria-label='有效期快捷选择'>
        {VALID_DAYS_PRESETS.map((item) => {
          const disabled = minDays != null && item.days < minDays;
          const isActive = value === item.days;
          return (
            <button
              key={item.days}
              type='button'
              className={classNames(styles['preset'], { [styles['isActive']]: isActive })}
              disabled={disabled}
              aria-pressed={isActive}
              aria-label={`设为 ${item.label}`}
              onClick={() => handlePresetClick(item.days)}>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
