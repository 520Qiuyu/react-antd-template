import { reqImportPermissionRoles } from '@/apis';
import { MyModal } from '@/components';
import { Status } from '@/constants';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { ImportPermissionRoleItem } from '@/types/permission';
import { downloadAsJson } from '@/utils/download';
import { msgError, msgSuccess } from '@/utils/modal';
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Table, Upload } from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RcFile } from 'antd/es/upload';
import { forwardRef, useState } from 'react';
import styles from './index.module.less';

const { Dragger } = Upload;

interface ImportRoleRow extends ImportPermissionRoleItem {
  key: string;
}

function ImportRoleModal(props: Props, ref: React.ForwardedRef<Ref<void>>) {
  const { onSuccess } = props;
  const [parsedData, setParsedData] = useState<ImportRoleRow[]>([]);
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
          name: '演示角色',
          code: 'demo_role',
          description: '演示角色描述',
          status: Status.NORMAL,
          remark: '可选备注',
        },
      ],
      '导入角色模板',
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
      const jsonData = JSON.parse(text) as ImportPermissionRoleItem[];

      if (!Array.isArray(jsonData)) {
        msgError('JSON 文件必须是一个数组');
        return;
      }

      setParsedData(
        jsonData.map((item, index) => ({
          ...item,
          key: item.id || `${item.code || 'role'}_${index}`,
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
      msgError('数据中存在缺少必填字段（角色名称、角色编码）的记录，请检查');
      return;
    }

    try {
      setLoading(true);
      const res = await reqImportPermissionRoles(parsedData);
      if (res.code !== 200) {
        return;
      }

      const { success = 0, failed = 0, failedItems = [] } = res.data ?? {};
      if (failed > 0) {
        msgError(`导入完成：成功 ${success} 条，失败 ${failed} 条`);
        console.error('导入失败的项目：', failedItems);
      } else {
        msgSuccess(`成功导入 ${success} 条角色`);
      }

      if (success > 0) {
        await onSuccess?.();
        close();
      }
    } catch (error) {
      console.error('批量导入角色失败：', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ImportRoleRow> = [
    { title: 'ID', dataIndex: 'id', width: 220, ellipsis: true, render: (val) => val || '-' },
    { title: '角色名称', dataIndex: 'name', width: 140 },
    { title: '角色编码', dataIndex: 'code', width: 140 },
    { title: '描述', dataIndex: 'description', width: 180, ellipsis: true, render: (val) => val || '-' },
    { title: '状态', dataIndex: 'status', width: 90, render: (val) => val || Status.NORMAL },
  ];

  return (
    <MyModal
      title='导入角色'
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

export default forwardRef(ImportRoleModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
