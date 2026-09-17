import { reqImportAuthInfos } from '@/apis/authManagement';
import { MyModal } from '@/components';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { AuthPlatform, ImportAuthInfoItem } from '@/types/authInfo';
import { downloadAsJson } from '@/utils/download';
import { msgError, msgSuccess } from '@/utils/modal';
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Table, Tag, Upload } from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RcFile } from 'antd/es/upload';
import { forwardRef, useState } from 'react';
import { AUTH_PLATFORM_COLOR_MAP, AUTH_PLATFORM_TEXT_MAP } from '../../constants';
import styles from './index.module.less';

const { Dragger } = Upload;

interface ImportAuthInfoRow extends ImportAuthInfoItem {
  key: string;
}

/**
 * 认证信息导入弹窗
 * @example
 * ```tsx
 * <ImportAuthInfoModal ref={importModalRef} onSuccess={handleSuccess} />
 * ```
 */
function ImportAuthInfoModal(props: Props, ref: React.ForwardedRef<Ref<void>>) {
  const { onSuccess } = props;
  const [parsedData, setParsedData] = useState<ImportAuthInfoRow[]>([]);
  const [loading, setLoading] = useState(false);

  const { visible, close } = useVisible(
    {
      onReset: () => {
        setParsedData([]);
      },
    },
    ref,
  );

  const handleViewTemplate = () => {
    downloadAsJson(
      [
        {
          platform: 'qishui',
          authInfo: { name: '主号' },
          status: 'normal',
          remark: '可选备注',
        },
      ],
      '导入认证信息模板',
    );
  };

  const handleUpload: UploadProps['onChange'] = async (info) => {
    const rcFile = info.file as RcFile;

    try {
      if (!rcFile.name.endsWith('.json')) {
        msgError('只支持上传 JSON 文件');
        return;
      }

      const text = await rcFile.text();
      const jsonData = JSON.parse(text) as ImportAuthInfoItem[];

      if (!Array.isArray(jsonData)) {
        msgError('JSON 文件必须是一个数组');
        return;
      }

      setParsedData(
        jsonData.map((item, index) => ({
          ...item,
          key: item.id || `auth_${index}`,
        })),
      );
    } catch (error) {
      console.error('解析文件失败：', error);
      msgError('解析文件失败，请检查文件格式是否正确');
    }
  };

  const handleOk = async () => {
    if (parsedData.length === 0) {
      msgError('请先上传并解析文件');
      return;
    }

    const hasInvalidData = parsedData.some(
      (item) => !item.platform || !item.authInfo || typeof item.authInfo !== 'object',
    );
    if (hasInvalidData) {
      msgError('数据中存在缺少必填字段（平台、认证 JSON）的记录，请检查');
      return;
    }

    try {
      setLoading(true);
      const res = await reqImportAuthInfos(parsedData);
      if (res.code !== 200) {
        return;
      }

      const { success = 0, failed = 0, failedItems = [] } = res.data ?? {};
      if (failed > 0) {
        msgError(`导入完成：成功 ${success} 条，失败 ${failed} 条`);
        console.error('导入失败的项目：', failedItems);
      } else {
        msgSuccess(`成功导入 ${success} 条认证信息`);
      }

      if (success > 0) {
        await onSuccess?.();
        close();
      }
    } catch (error) {
      console.error('批量导入认证信息失败：', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ImportAuthInfoRow> = [
    { title: 'ID', dataIndex: 'id', width: 220, ellipsis: true, render: (val) => val || '-' },
    {
      title: '名称',
      key: 'name',
      width: 140,
      ellipsis: true,
      render: (_, record) =>
        typeof record.authInfo?.name === 'string' ? record.authInfo.name : '-',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 120,
      render: (platform: AuthPlatform) => (
        <Tag color={AUTH_PLATFORM_COLOR_MAP[platform]}>
          {AUTH_PLATFORM_TEXT_MAP[platform] || platform}
        </Tag>
      ),
    },
    { title: '状态', dataIndex: 'status', width: 100, render: (val) => val || 'normal' },
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true, render: (val) => val || '-' },
  ];

  return (
    <MyModal
      title='导入认证信息'
      open={visible}
      onCancel={close}
      confirmLoading={loading}
      onOk={handleOk}
      width={960}>
      <div className={styles['container']}>
        <div className={styles['toolbar']}>
          <Button icon={<FileTextOutlined />} onClick={handleViewTemplate}>
            查看模板
          </Button>
        </div>

        <Dragger
          accept='application/json,.json'
          showUploadList={false}
          maxCount={1}
          onChange={handleUpload}
          beforeUpload={() => false}>
          <p className='ant-upload-drag-icon'>
            <InboxOutlined />
          </p>
          <p className='ant-upload-text'>点击或拖拽 JSON 文件到此区域上传</p>
          <p className='ant-upload-hint'>支持带 id 导入；有 id 时按 id 更新或创建</p>
        </Dragger>

        <div>
          <div className={styles['summary']}>已解析 {parsedData.length} 条数据</div>
          <Table
            columns={columns}
            dataSource={parsedData}
            rowKey='key'
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800, y: 300 }}
          />
        </div>
      </div>
    </MyModal>
  );
}

export default forwardRef(ImportAuthInfoModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
