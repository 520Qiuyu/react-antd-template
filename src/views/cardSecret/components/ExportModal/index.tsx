import { MyButton, MyModal } from '@/components';
import { NOOP } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { CardSecretListItem } from '@/types/cardSecret';
import copy from '@/utils/copy';
import { msgError, msgSuccess } from '@/utils/modal';
import { CopyOutlined } from '@ant-design/icons';
import { Card, Form, Input } from 'antd';
import dayjs from 'dayjs';
import { forwardRef, useMemo, useState, type ForwardedRef } from 'react';
import { CARD_SECRET_TYPE_TEXT_MAP } from '../../constants';
import styles from './index.module.less';

const { TextArea } = Input;

interface Props {
  onSuccess?: () => void;
}

/** 打开参数：选中的卡密行 */
export interface ExportOpenParams {
  selectedRows: CardSecretListItem[];
}

const DEFAULT_TEMPLATE = '【卡号】|【访问链接】';

/**
 * 构建卡密解析访问链接
 * @example
 * ```ts
 * const url = buildCardSecretParseUrl('abc123');
 * ```
 */
const buildCardSecretParseUrl = (secret: string) => {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/qishui/link-parse?cardSecret=${secret}`;
};

const PLACEHOLDER_MAP = {
  '【卡号】': (record: CardSecretListItem) => record.secret ?? '',
  '【访问链接】': (record: CardSecretListItem) => buildCardSecretParseUrl(record.secret),
  '【类型】': (record: CardSecretListItem) => CARD_SECRET_TYPE_TEXT_MAP[record.type] ?? '',
  '【过期时间】': (record: CardSecretListItem) =>
    record.expireTime ? dayjs(record.expireTime).format('YYYY-MM-DD HH:mm:ss') : '',
  '【启用时间】': (record: CardSecretListItem) =>
    record.enableTime ? dayjs(record.enableTime).format('YYYY-MM-DD HH:mm:ss') : '未启用',
  '【有效期】': (record: CardSecretListItem) =>
    record.validDays != null ? `${record.validDays}天` : '',
  '【总次数】': (record: CardSecretListItem) =>
    record.parseLimit != null ? String(record.parseLimit) : '',
  '【每日上限】': (record: CardSecretListItem) =>
    record.dailyParseLimit != null && record.dailyParseLimit > 0
      ? String(record.dailyParseLimit)
      : '不限',
  '【备注】': (record: CardSecretListItem) => record.remark ?? '',
} as const;

function ExportModal(props: Props, ref: ForwardedRef<Ref<void, ExportOpenParams>>) {
  const { onSuccess = NOOP } = props;
  const [selectedRows, setSelectedRows] = useState<CardSecretListItem[]>([]);
  const [template, setTemplate] = useLocalStorageState('qishuiCardSecretExportTemplate', {
    defaultValue: DEFAULT_TEMPLATE,
  });
  const { visible, close } = useVisible(
    {
      onOpen(params?: ExportOpenParams) {
        const rows = params?.selectedRows ?? [];
        setSelectedRows(rows);
      },
      onReset() {
        setSelectedRows([]);
      },
    },
    ref,
  );

  const templateText = useMemo(() => {
    const t = template ?? '';
    return selectedRows
      .map((record) => {
        return Object.keys(PLACEHOLDER_MAP).reduce(
          (line, key) =>
            line.replaceAll(key, PLACEHOLDER_MAP[key as keyof typeof PLACEHOLDER_MAP](record)),
          t,
        );
      })
      .join('\n');
  }, [template, selectedRows]);

  /** 复制预览内容 */
  const handleCopyPreview = async () => {
    try {
      await copy(templateText);
      msgSuccess('已复制到剪贴板');
      onSuccess?.();
      close();
    } catch {
      msgError('复制失败');
    }
  };

  return (
    <MyModal title='导出卡密' open={visible} onCancel={close} footer={null} width={800}>
      <div className={styles['exportModal']}>
        <Form layout='vertical'>
          <Form.Item label='导出模板' className={styles['templateTextarea']}>
            <TextArea
              rows={3}
              placeholder={DEFAULT_TEMPLATE}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </Form.Item>
          <div className={styles['description']}>
            <span className={styles['descriptionLabel']}>占位符说明</span>
            <span className={styles['descriptionText']}>
              每行对应一条卡密。可用：
              {Object.keys(PLACEHOLDER_MAP).join('、')}
            </span>
          </div>
        </Form>

        <Card
          size='small'
          className={styles['previewCard']}
          title='预览'
          extra={
            <span className={styles['previewExtra']}>
              {selectedRows.length > 0 && (
                <span className={styles['count']}>共 {selectedRows.length} 条</span>
              )}
              <MyButton
                type='primary'
                size='small'
                icon={<CopyOutlined />}
                onClick={handleCopyPreview}
                disabled={!templateText}>
                复制
              </MyButton>
            </span>
          }>
          <div className={styles['previewContent']} role='textbox' aria-label='导出预览内容'>
            {templateText || '选择卡密并填写模板后在此预览'}
          </div>
        </Card>
      </div>
    </MyModal>
  );
}

export default forwardRef(ExportModal);
