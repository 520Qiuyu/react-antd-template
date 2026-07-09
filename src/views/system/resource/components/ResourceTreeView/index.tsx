import { reqDeletePermissionResource, reqGetPermissionResourceTree } from '@/apis';
import { MyButton } from '@/components';
import type { Ref } from '@/hooks/useVisible';
import type {
  PermissionResourceItem,
  PermissionResourceTreeNode,
  PermissionResourceType,
} from '@/types/permission';
import { confirm, msgError, msgSuccess } from '@/utils/modal';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { RESOURCE_TYPE_MAP } from '../../constants';
import styles from './index.module.less';

type TreeRecord = PermissionResourceTreeNode & {
  children?: TreeRecord[];
};

interface Props {
  formModalRef: React.RefObject<Ref<void, PermissionResourceItem | void> | null>;
  refreshKey?: number;
}

function mapLazyNodes(nodes: PermissionResourceTreeNode[]): TreeRecord[] {
  return nodes.map((node) => ({
    ...node,
    children: node.hasChildren ? [] : undefined,
  }));
}

function updateTreeNode(
  list: TreeRecord[],
  id: string,
  updater: (node: TreeRecord) => TreeRecord,
): TreeRecord[] {
  return list.map((item) => {
    if (item.id === id) {
      return updater(item);
    }
    if (item.children?.length) {
      return { ...item, children: updateTreeNode(item.children, id, updater) };
    }
    return item;
  });
}

const ResourceTreeView: React.FC<Props> = ({ formModalRef, refreshKey }) => {
  const [dataSource, setDataSource] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await reqGetPermissionResourceTree({ mode: 'lazy' });
      if (res.code !== 200) return msgError(res.message);
      setDataSource(mapLazyNodes(res.data ?? []));
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [refreshKey]);

  const loadChildren = async (record: TreeRecord) => {
    if (!record.hasChildren || (record.children && record.children.length > 0)) {
      return;
    }

    try {
      setLoadingKeys((prev) => [...prev, record.id]);
      const res = await reqGetPermissionResourceTree({
        mode: 'lazy',
        parentId: record.id,
      });
      if (res.code !== 200) return msgError(res.message);
      const children = mapLazyNodes(res.data ?? []);
      setDataSource((prev) => updateTreeNode(prev, record.id, (node) => ({ ...node, children })));
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoadingKeys((prev) => prev.filter((key) => key !== record.id));
    }
  };

  const handleDelete = async (record: PermissionResourceItem) => {
    try {
      await confirm(`确定要删除资源「${record.name}」吗？`, '提示');
      const res = await reqDeletePermissionResource(record.id);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('删除成功');
      fetchTree();
    } catch (error) {
      console.log('error', error);
    }
  };

  const columns: ColumnsType<TreeRecord> = [
    { title: '资源名称', dataIndex: 'name', width: 200 },
    { title: '资源编码', dataIndex: 'code', width: 180 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: PermissionResourceType) => {
        const item = RESOURCE_TYPE_MAP[type] ?? { label: type, color: 'default' };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    { title: 'URL', dataIndex: 'url', width: 220, ellipsis: true, render: (val) => val || '-' },
    { title: 'Method', dataIndex: 'method', width: 100, render: (val) => val || '-' },
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true, render: (val) => val || '-' },
    {
      title: '创建时间',
      dataIndex: 'ctime',
      width: 180,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <MyButton
            variant='text'
            color='primary'
            icon={<EditOutlined />}
            toolTip='编辑'
            onClick={() => formModalRef.current?.open(record)}
          />
          <MyButton
            variant='text'
            color='danger'
            icon={<DeleteOutlined />}
            toolTip='删除'
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={styles['view']}>
      <div className={styles['toolbar']}>
        <MyButton icon={<ReloadOutlined />} onClick={fetchTree} loading={loading}>
          刷新
        </MyButton>
        <MyButton
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => formModalRef.current?.open()}>
          新建资源
        </MyButton>
      </div>
      <Table
        rowKey='id'
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        scroll={{ x: 1200 }}
        expandable={{
          onExpand: (expanded, record) => {
            if (expanded) {
              loadChildren(record);
            }
          },
        }}
        rowClassName={(record) => (loadingKeys.includes(record.id) ? styles['rowLoading'] : '')}
      />
    </div>
  );
};

export default ResourceTreeView;
