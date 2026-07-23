import { CopyText, MyModal } from '@/components';
import SubTitle from '@/components/SubTitle';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { ParseLogListItem } from '@/types/parseLog';
import copy from '@/utils/copy';
import { msgSuccess } from '@/utils/modal';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  CopyOutlined,
  GlobalOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import dayjs from 'dayjs';
import { forwardRef, useMemo, useState } from 'react';
import {
  PARSE_LOG_STATUS_COLOR_MAP,
  PARSE_LOG_STATUS_TEXT_MAP,
  PARSE_LOG_TYPE_COLOR_MAP,
  PARSE_LOG_TYPE_TEXT_MAP,
} from '../../constants';
import styles from './index.module.less';

/**
 * 解析 JSON 字符串为普通对象条目；失败则返回 null
 * @example
 * ```ts
 * const entries = parseParamsEntries('{"songId":"1"}');
 * // [['songId', '1']]
 * ```
 */
const parseParamsEntries = (raw?: string | null): [string, string][] | null => {
  if (!raw?.trim()) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);
  } catch {
    return null;
  }
};

/**
 * 解析日志详情弹窗
 * @example
 * ```tsx
 * const detailModalRef = useCompRef(ParseLogDetailModal);
 * detailModalRef.current?.open(record);
 * ```
 */
function ParseLogDetailModal(_props: Props, ref: React.ForwardedRef<Ref<void, ParseLogListItem>>) {
  const [record, setRecord] = useState<ParseLogListItem | null>(null);

  const { visible, close } = useVisible(
    {
      onOpen: (data?: ParseLogListItem) => {
        setRecord(data ?? null);
      },
      onReset: () => {
        setRecord(null);
      },
    },
    ref,
  );

  const isSuccess = record?.status === 'success';
  const paramsEntries = useMemo(
    () => parseParamsEntries(record?.parseParams),
    [record?.parseParams],
  );

  const handleCopyRawParams = () => {
    if (!record?.parseParams) return;
    copy(record.parseParams);
    msgSuccess('复制成功');
  };

  return (
    <MyModal
      title='日志详情'
      open={visible}
      onCancel={close}
      footer={null}
      width={640}
      styles={{
        body: {
          maxHeight: '80vh',
          overflowY: 'auto',
        },
      }}>
      {record ? (
        <div className={styles['body']}>
          <section
            className={`${styles['hero']} ${isSuccess ? styles['heroSuccess'] : styles['heroFail']}`}>
            <div className={styles['heroStatus']}>
              {isSuccess ? (
                <CheckCircleFilled className={styles['heroIcon']} />
              ) : (
                <CloseCircleFilled className={styles['heroIcon']} />
              )}
              <div className={styles['heroText']}>
                <div className={styles['heroTitleRow']}>
                  <h3 className={styles['heroTitle']} title={record.targetName}>
                    {record.targetName}
                  </h3>
                  <Tag color={PARSE_LOG_TYPE_COLOR_MAP[record.type]}>
                    {PARSE_LOG_TYPE_TEXT_MAP[record.type]}
                  </Tag>
                  <Tag color={PARSE_LOG_STATUS_COLOR_MAP[record.status]}>
                    {PARSE_LOG_STATUS_TEXT_MAP[record.status]}
                  </Tag>
                </div>
                <p className={styles['heroSub']}>
                  <ClockCircleOutlined />
                  <span>{dayjs(record.ctime).format('YYYY-MM-DD HH:mm:ss')}</span>
                  <span className={styles['dot']} />
                  <span>{record.durationMs}ms</span>
                </p>
              </div>
            </div>
            <div className={styles['heroMeta']}>
              <span className={styles['metaChip']}>
                <GlobalOutlined />
                {record.ip}
              </span>
              <span className={styles['metaChip']}>
                <LinkOutlined />
                {record.method}
              </span>
            </div>
          </section>

          <section className={styles['section']}>
            <SubTitle title='基础信息' className={styles['sectionTitle']} />
            <div className={styles['grid']}>
              <DetailItem label='日志 ID' value={<CopyText text={record.id} />} />
              <DetailItem
                label='账号'
                value={record.userAccount || <span className={styles['muted']}>游客</span>}
              />
              <DetailItem
                label='卡密'
                value={
                  record.cardSecret ? (
                    <CopyText text={record.cardSecret} />
                  ) : (
                    <span className={styles['muted']}>-</span>
                  )
                }
                full
              />
              <DetailItem
                label='目标 ID'
                value={
                  record.targetId ? (
                    <CopyText text={record.targetId} />
                  ) : (
                    <span className={styles['muted']}>-</span>
                  )
                }
                full
              />
            </div>
          </section>

          <section className={styles['section']}>
            <SubTitle title='解析参数' className={styles['sectionTitle']} />
            {!record.parseParams ? (
              <div className={styles['paramsEmpty']}>暂无解析参数</div>
            ) : paramsEntries ? (
              <div className={styles['grid']}>
                {paramsEntries.map(([key, value]) => (
                  <DetailItem key={key} label={key} value={<CopyText text={value} />} full />
                ))}
              </div>
            ) : (
              <div className={styles['paramsRaw']}>
                <div className={styles['paramsRawHeader']}>
                  <span>无法解析为 JSON，展示原文</span>
                  <Button
                    type='link'
                    size='small'
                    icon={<CopyOutlined />}
                    onClick={handleCopyRawParams}
                    aria-label='复制解析参数原文'>
                    复制
                  </Button>
                </div>
                <pre className={styles['paramsPre']}>{record.parseParams}</pre>
              </div>
            )}
          </section>

          <section className={styles['section']}>
            <SubTitle title='请求信息' className={styles['sectionTitle']} />
            <div className={styles['grid']}>
              <DetailItem label='请求 IP' value={record.ip} />
              <DetailItem label='请求方法' value={<Tag>{record.method}</Tag>} />
              <DetailItem label='请求路径' value={<CopyText text={record.path} />} full />
              <DetailItem label='耗时' value={`${record.durationMs} ms`} />
              <DetailItem
                label='更新时间'
                value={dayjs(record.utime).format('YYYY-MM-DD HH:mm:ss')}
              />
            </div>
          </section>

          <section className={styles['section']}>
            <SubTitle title='结果信息' className={styles['sectionTitle']} />
            {isSuccess ? (
              <div className={styles['resultOk']}>
                <CheckCircleFilled />
                <div>
                  <div className={styles['resultTitle']}>解析成功</div>
                  <div className={styles['resultDesc']}>本次请求已正常完成，无错误信息。</div>
                </div>
              </div>
            ) : (
              <div className={styles['resultFail']}>
                <CloseCircleFilled />
                <div>
                  <div className={styles['resultTitle']}>解析失败</div>
                  <div className={styles['resultDesc']}>
                    {record.errorMsg || '未记录具体失败原因'}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </MyModal>
  );
}

/**
 * 详情字段项
 * @example
 * ```tsx
 * <DetailItem label="卡密" value={<CopyText text={secret} />} />
 * ```
 */
const DetailItem: React.FC<DetailItemProps> = ({ label, value, full }) => {
  return (
    <div className={`${styles['item']} ${full ? styles['itemFull'] : ''}`}>
      <div className={styles['itemLabel']}>{label}</div>
      <div className={styles['itemValue']}>{value}</div>
    </div>
  );
};

export default forwardRef(ParseLogDetailModal);

interface Props {}

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}
