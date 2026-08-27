import { MyButton, MyModal } from '@/components';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { CardSecretListItem } from '@/types/cardSecret';
import { msgSuccess } from '@/utils/modal';
import { useLocalStorageState } from 'ahooks';
import { Form, Input, Space, Tag } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { forwardRef, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  COPY_TEMPLATE_PLACEHOLDERS,
  COPY_TEMPLATE_STORAGE_KEY,
  DEFAULT_COPY_TEMPLATE,
  applyCopyTemplate,
} from '../../utils/copyTemplate';
import styles from './index.module.less';

const { TextArea } = Input;

/** 弹窗预览用的示例卡密（按时长） */
const SAMPLE_RECORD: CardSecretListItem = {
  id: 'sample-id',
  secret: 'QSDEMO123456',
  type: 'time',
  expireTime: '2026-12-31 23:59:59',
  enableTime: null,
  validDays: 30,
  parseLimit: 0,
  parsedCount: 0,
  unparsedCount: 0,
  dailyParseLimit: 20,
  remark: '示例备注',
  status: 'normal',
  ctime: '2026-01-01 00:00:00',
  utime: '2026-01-01 00:00:00',
};

interface Props {
  onSuccess?: () => void;
}

/**
 * 卡密发货复制模板设置弹窗
 * @example
 * ```tsx
 * const ref = useCompRef(CopyTemplateModal);
 * <CopyTemplateModal ref={ref} />
 * ref.current?.open();
 * ```
 */
function CopyTemplateModal(_props: Props, ref: React.ForwardedRef<Ref>) {
  const textareaRef = useRef<TextAreaRef>(null);
  const [storedTemplate, setStoredTemplate] = useLocalStorageState(COPY_TEMPLATE_STORAGE_KEY, {
    defaultValue: DEFAULT_COPY_TEMPLATE,
  });
  const [draft, setDraft] = useState(DEFAULT_COPY_TEMPLATE);

  const { visible, close } = useVisible(
    {
      onOpen() {
        setDraft(storedTemplate?.trim() ? storedTemplate : DEFAULT_COPY_TEMPLATE);
      },
    },
    ref,
  );

  const previewText = useMemo(
    () => applyCopyTemplate(draft || DEFAULT_COPY_TEMPLATE, SAMPLE_RECORD),
    [draft],
  );

  /** 在光标处插入占位符 */
  const handleInsertPlaceholder = (placeholder: string) => {
    const el = textareaRef.current?.resizableTextArea?.textArea;
    if (!el) {
      setDraft((prev) => `${prev ?? ''}${placeholder}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = draft ?? '';
    const next = `${value.slice(0, start)}${placeholder}${value.slice(end)}`;
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + placeholder.length;
      el.setSelectionRange(pos, pos);
    });
  };

  /** 键盘触发插入占位符 */
  const handlePlaceholderKeyDown = (e: KeyboardEvent, placeholder: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    handleInsertPlaceholder(placeholder);
  };

  /** 恢复默认模板（仅编辑态） */
  const handleResetDefault = () => {
    setDraft(DEFAULT_COPY_TEMPLATE);
  };

  /** 保存模板到本地 */
  const handleSave = () => {
    const next = draft?.trim() ? draft : DEFAULT_COPY_TEMPLATE;
    setStoredTemplate(next);
    msgSuccess('复制模板已保存');
    close();
  };

  return (
    <MyModal
      title='设置卡密复制模板'
      open={visible}
      onCancel={close}
      width={720}
      footer={
        <div className={styles['footer']}>
          <MyButton onClick={handleResetDefault}>恢复默认</MyButton>
          <Space>
            <MyButton onClick={close}>取消</MyButton>
            <MyButton type='primary' onClick={handleSave}>
              保存
            </MyButton>
          </Space>
        </div>
      }>
      <div className={styles['copyTemplateModal']}>
        <Form layout='vertical'>
          <Form.Item label='复制模板' className={styles['templateField']}>
            <TextArea
              ref={textareaRef}
              rows={8}
              value={draft}
              placeholder={DEFAULT_COPY_TEMPLATE}
              onChange={(e) => setDraft(e.target.value)}
              aria-label='卡密复制模板编辑区'
            />
          </Form.Item>
        </Form>

        <div className={styles['placeholderSection']}>
          <span className={styles['sectionLabel']}>可替换字符</span>
          <p className={styles['sectionHint']}>点击标签插入到光标处</p>
          <div className={styles['tagList']} role='list' aria-label='可替换字符列表'>
            {COPY_TEMPLATE_PLACEHOLDERS.map((item) => (
              <Tag
                key={item.key}
                className={styles['placeholderTag']}
                role='listitem'
                tabIndex={0}
                aria-label={`插入${item.label}`}
                onClick={() => handleInsertPlaceholder(item.key)}
                onKeyDown={(e) => handlePlaceholderKeyDown(e, item.key)}>
                {item.key}
              </Tag>
            ))}
          </div>
        </div>

        <div className={styles['previewSection']}>
          <div className={styles['previewHeader']}>
            <span className={styles['sectionLabel']}>实时预览</span>
            <span className={styles['previewHint']}>示例卡密 · 按时间</span>
          </div>
          <div
            className={styles['previewContent']}
            role='textbox'
            aria-readonly='true'
            aria-label='复制模板预览'>
            {previewText}
          </div>
        </div>
      </div>
    </MyModal>
  );
}

export default forwardRef(CopyTemplateModal);
