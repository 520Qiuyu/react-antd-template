import {
  reqGetPermissionResourceTree,
  reqListAllPermissionRoleResources,
  reqSyncPermissionRoleResources,
} from '@/apis';
import { MyModal } from '@/components';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type { PermissionResourceTreeNode, PermissionRoleItem } from '@/types/permission';
import { msgError, msgSuccess } from '@/utils/modal';
import { ApartmentOutlined } from '@ant-design/icons';
import { Empty, Input, Spin, Tag, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { RESOURCE_TYPE_MAP } from '@/views/system/resource/constants';
import styles from '../roleModal.module.less';

function collectTreeKeys(nodes: PermissionResourceTreeNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: PermissionResourceTreeNode[]) => {
    list.forEach((node) => {
      keys.push(node.id);
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return keys;
}

function filterResourceTree(
  nodes: PermissionResourceTreeNode[],
  keyword: string,
): PermissionResourceTreeNode[] {
  if (!keyword) return nodes;

  const lowerKeyword = keyword.toLowerCase();
  const matchNode = (node: PermissionResourceTreeNode) =>
    node.name.toLowerCase().includes(lowerKeyword) ||
    node.code.toLowerCase().includes(lowerKeyword) ||
    (node.url?.toLowerCase().includes(lowerKeyword) ?? false);

  const walk = (list: PermissionResourceTreeNode[]): PermissionResourceTreeNode[] =>
    list.reduce<PermissionResourceTreeNode[]>((acc, node) => {
      const children = node.children?.length ? walk(node.children) : [];
      if (matchNode(node) || children.length > 0) {
        acc.push({
          ...node,
          children: children.length > 0 ? children : node.children,
        });
      }
      return acc;
    }, []);

  return walk(nodes);
}

function mapToTreeData(nodes: PermissionResourceTreeNode[]): DataNode[] {
  return nodes.map((node) => {
    const typeItem = RESOURCE_TYPE_MAP[node.type] ?? { label: node.type, color: 'default' };
    return {
      key: node.id,
      title: (
        <span className={styles['treeNodeTitle']}>
          <span className={styles['treeNodeName']}>{node.name}</span>
          <Tag color={typeItem.color} className={styles['treeNodeTag']}>
            {typeItem.label}
          </Tag>
          <span className={styles['treeNodeCode']}>{node.code}</span>
        </span>
      ),
      children: node.children?.length ? mapToTreeData(node.children) : undefined,
    };
  });
}

function RoleResourceModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, PermissionRoleItem>>,
) {
  const { onSuccess } = props;
  const [role, setRole] = useState<PermissionRoleItem | null>(null);
  const [treeSource, setTreeSource] = useState<PermissionResourceTreeNode[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { visible, close } = useVisible(
    {
      onOpen: (record?: PermissionRoleItem) => {
        if (!record) return;
        setRole(record);
        setKeyword('');
        setSearchKeyword('');
        setTreeSource([]);
        setCheckedKeys([]);
        setExpandedKeys([]);
      },
      onReset: () => {
        setRole(null);
        setTreeSource([]);
        setKeyword('');
        setSearchKeyword('');
        setCheckedKeys([]);
        setExpandedKeys([]);
        setLoading(false);
        setSubmitting(false);
      },
    },
    ref,
  );

  const fetchRoleResources = useCallback(async (roleId: string) => {
    const roleResources = await reqListAllPermissionRoleResources(roleId);
    return roleResources.map((item) => item.resourceId);
  }, []);

  const fetchResourceTree = useCallback(async () => {
    const res = await reqGetPermissionResourceTree({ mode: 'full' });
    if (res.code !== 200) {
      msgError(res.message);
      return [];
    }
    return res.data ?? [];
  }, []);

  useEffect(() => {
    if (!visible || !role) return;

    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        const [tree, resourceIds] = await Promise.all([
          fetchResourceTree(),
          fetchRoleResources(role.id),
        ]);
        if (cancelled) return;
        setTreeSource(tree);
        setCheckedKeys(resourceIds);
        setExpandedKeys(collectTreeKeys(tree));
      } catch (error) {
        console.log('error', error);
        if (!cancelled) {
          msgError(error instanceof Error ? error.message : '加载角色资源失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [visible, role, fetchResourceTree, fetchRoleResources]);

  const filteredTree = useMemo(
    () => filterResourceTree(treeSource, searchKeyword),
    [treeSource, searchKeyword],
  );

  const treeData = useMemo(() => mapToTreeData(filteredTree), [filteredTree]);

  useEffect(() => {
    if (!searchKeyword) {
      setExpandedKeys(collectTreeKeys(treeSource));
      return;
    }
    setExpandedKeys(collectTreeKeys(filteredTree));
  }, [searchKeyword, treeSource, filteredTree]);

  const handleSearch = (value: string) => {
    setSearchKeyword(value.trim());
  };

  const handleSave = async () => {
    if (!role) return;
    try {
      setSubmitting(true);
      const res = await reqSyncPermissionRoleResources(role.id, checkedKeys);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess('资源授权成功');
      close();
      await onSuccess?.();
    } catch (error) {
      console.log('error', error);
      msgError(error instanceof Error ? error.message : '资源授权失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      title='资源管理'
      open={visible}
      confirmLoading={submitting}
      onOk={handleSave}
      onCancel={close}
      width={720}
      okText='保存'>
      {role && (
        <div className={styles['roleSummary']}>
          <div className={styles['roleIcon']}>
            <ApartmentOutlined />
          </div>
          <div className={styles['roleMeta']}>
            <div className={styles['roleName']}>{role.name}</div>
            <div className={styles['roleCode']}>{role.code}</div>
          </div>
          <Tag color='blue' className={styles['selectedCount']}>
            已选 {checkedKeys.length} 个资源
          </Tag>
        </div>
      )}

      <div className={styles['toolbar']}>
        <Input.Search
          allowClear
          placeholder='搜索资源名称、编码或 URL'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
        />
      </div>

      <Spin spinning={loading}>
        <div className={styles['treePanel']}>
          {treeData.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无匹配资源' />
          ) : (
            <Tree
              checkable
              blockNode
              selectable={false}
              treeData={treeData}
              checkedKeys={checkedKeys}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys as string[])}
              onCheck={(checked) => {
                setCheckedKeys(checked as string[]);
              }}
            />
          )}
        </div>
      </Spin>
    </MyModal>
  );
}

export default forwardRef(RoleResourceModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
