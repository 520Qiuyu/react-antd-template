import { reqImportPermissionResources } from '@/apis';
import { MyModal } from '@/components';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { ImportPermissionResourceItem } from '@/types/permission';
import { downloadAsJson } from '@/utils/download';
import { msgError, msgSuccess } from '@/utils/modal';
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Table, Tag, Upload } from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RcFile } from 'antd/es/upload';
import { forwardRef, useState } from 'react';
import { RESOURCE_TYPE_MAP } from '../../constants';
import styles from './index.module.less';

const { Dragger } = Upload;

interface ImportResourceRow extends ImportPermissionResourceItem {
  key: string;
}

function ImportResourceModal(props: Props, ref: React.ForwardedRef<Ref<void>>) {
  const { onSuccess } = props;
  const [parsedData, setParsedData] = useState<ImportResourceRow[]>([]);
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
          id: '00000000-0000-0000-0000-000000000001',
          name: '用户管理',
          code: 'system:user',
          type: 'menu',
          parentId: null,
          url: '/system/user',
          remark: '可选备注',
        },
      ],
      '导入资源模板',
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
      const jsonData = JSON.parse(text) as ImportPermissionResourceItem[];

      if (!Array.isArray(jsonData)) {
        msgError('JSON 文件必须是一个数组');
        return;
      }

      setParsedData(
        jsonData.map((item, index) => ({
          ...item,
          parentId: item.parentId || undefined,
          key: item.id || `${item.code || 'resource'}_${index}`,
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

    const hasInvalidData = parsedData.some((item) => !item.name || !item.code);
    if (hasInvalidData) {
      msgError('数据中存在缺少必填字段（资源名称、资源编码）的记录，请检查');
      return;
    }

    try {
      setLoading(true);
      const res = await reqImportPermissionResources(parsedData);
      if (res.code !== 200) {
        return msgError(res.message);
      }

      const { success = 0, failed = 0, failedItems = [] } = res.data ?? {};
      if (failed > 0) {
        msgError(`导入完成：成功 ${success} 条，失败 ${failed} 条`);
        console.error('导入失败的项目：', failedItems);
      } else {
        msgSuccess(`成功导入 ${success} 条资源`);
      }

      if (success > 0) {
        await onSuccess?.();
        close();
      }
    } catch (error) {
      console.error('批量导入资源失败：', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ImportResourceRow> = [
    { title: 'ID', dataIndex: 'id', width: 220, ellipsis: true, render: (val) => val || '-' },
    { title: '资源名称', dataIndex: 'name', width: 140 },
    { title: '资源编码', dataIndex: 'code', width: 160 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type) => {
        const item = RESOURCE_TYPE_MAP[type] ?? { label: type, color: 'default' };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    { title: 'URL', dataIndex: 'url', width: 180, ellipsis: true, render: (val) => val || '-' },
    { title: 'Method', dataIndex: 'method', width: 90, render: (val) => val || '-' },
  ];

  return (
    <MyModal
      title='导入资源'
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
          <p className='ant-upload-hint'>支持带 id 全量导入；有 id 时按 id 更新或创建</p>
        </Dragger>

        <div>
          <div className={styles['summary']}>已解析 {parsedData.length} 条数据</div>
          <Table
            columns={columns}
            dataSource={parsedData}
            rowKey='key'
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900, y: 300 }}
          />
        </div>
      </div>
    </MyModal>
  );
}

export default forwardRef(ImportResourceModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
