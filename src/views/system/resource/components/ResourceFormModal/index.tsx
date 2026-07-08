import {
  reqCreatePermissionResource,
  reqGetPermissionResourceTree,
  reqUpdatePermissionResource,
} from '@/apis';
import { MyModal } from '@/components';
import SubTitle from '@/components/SubTitle';
import { useVisible } from '@/hooks';
import type { Ref } from '@/hooks/useVisible';
import type {
  CreatePermissionResourceParams,
  PermissionResourceItem,
  PermissionResourceMethod,
  PermissionResourceTreeNode,
  PermissionResourceType,
} from '@/types/permission';
import { msgError, msgSuccess } from '@/utils/modal';
import { Form, Input, Select, TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { forwardRef } from 'react';
import styles from './index.module.less';

const TYPE_OPTIONS = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
  { label: '接口', value: 'api' },
  { label: '模块', value: 'module' },
];

const METHOD_OPTIONS: { label: string; value: PermissionResourceMethod }[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'OPTIONS', value: 'OPTIONS' },
  { label: 'HEAD', value: 'HEAD' },
];

type ParentTreeOption = NonNullable<TreeSelectProps['treeData']>[number];

function ResourceFormModal(
  props: Props,
  ref: React.ForwardedRef<Ref<void, PermissionResourceItem | void>>,
) {
  const { onSuccess } = props;
  const [formRef] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<PermissionResourceItem | null>(null);
  const [parentOptions, setParentOptions] = useState<ParentTreeOption[]>([]);
  const [parentLoading, setParentLoading] = useState(false);
  const isEdit = !!editingRecord;
  const resourceType = Form.useWatch('type', formRef) as PermissionResourceType | undefined;

  const buildParentOptions = (
    nodes: PermissionResourceTreeNode[],
    currentId?: string,
  ): ParentTreeOption[] =>
    nodes.map((node) => ({
      title: `${node.name} (${node.code})`,
      value: node.id,
      key: node.id,
      disabled: node.id === currentId,
      children: node.children?.length ? buildParentOptions(node.children, currentId) : undefined,
    }));

  const loadParentOptions = async (record?: PermissionResourceItem) => {
    setParentLoading(true);
    try {
      const res = await reqGetPermissionResourceTree({ mode: 'full' });
      if (res.code !== 200) {
        return msgError(res.message);
      }
      setParentOptions(buildParentOptions(res.data ?? [], record?.id));
    } finally {
      setParentLoading(false);
    }
  };

  const { visible, close } = useVisible(
    {
      onOpen: (record?: PermissionResourceItem) => {
        setEditingRecord(record ?? null);
        void loadParentOptions(record);
        if (record) {
          formRef.setFieldsValue({
            name: record.name,
            code: record.code,
            type: record.type,
            parentId: record.parentId || undefined,
            url: record.url || undefined,
            method: record.method || undefined,
            remark: record.remark || undefined,
          });
        } else {
          formRef.setFieldsValue({ type: 'api' });
        }
      },
      onReset: () => {
        formRef.resetFields();
        setEditingRecord(null);
        setParentOptions([]);
      },
    },
    ref,
  );

  const handleSave = async () => {
    try {
      const values = await formRef.validateFields();
      const payload: CreatePermissionResourceParams = {
        ...values,
        parentId: values.parentId || undefined,
        url: values.type === 'api' ? values.url || undefined : values.url || undefined,
        method: values.type === 'api' ? values.method || undefined : undefined,
        remark: values.remark || undefined,
      };
      const res = isEdit
        ? await reqUpdatePermissionResource(editingRecord!.id, payload)
        : await reqCreatePermissionResource(payload);
      if (res.code !== 200) return msgError(res.message);
      msgSuccess(isEdit ? '更新成功' : '创建成功');
      close();
      await onSuccess?.();
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <MyModal
      title={isEdit ? '编辑资源' : '新建资源'}
      open={visible}
      onOk={handleSave}
      onCancel={close}
      width={720}>
      <Form form={formRef} layout='vertical' className={styles['form']}>
        <div className={styles['section']}>
          <SubTitle title='基础信息' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item
              label='资源名称'
              name='name'
              rules={[{ required: true, message: '请输入资源名称' }]}>
              <Input placeholder='例如：用户列表、角色删除' />
            </Form.Item>
            <Form.Item
              label='资源编码'
              name='code'
              rules={[{ required: true, message: '请输入资源编码' }]}>
              <Input placeholder='请输入唯一资源编码' disabled={isEdit} />
            </Form.Item>
            <Form.Item
              label='资源类型'
              name='type'
              rules={[{ required: true, message: '请选择资源类型' }]}>
              <Select options={TYPE_OPTIONS} placeholder='请选择资源类型' />
            </Form.Item>
            <Form.Item label='父级资源' name='parentId'>
              <TreeSelect
                allowClear
                showSearch
                loading={parentLoading}
                treeDefaultExpandAll
                treeNodeFilterProp='title'
                placeholder='请选择父级资源，不选则为顶级'
                treeData={parentOptions}
              />
            </Form.Item>
          </div>
        </div>

        <div className={styles['section']}>
          <SubTitle title='资源配置' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            {resourceType === 'api' && (
              <>
                <Form.Item
                  label='接口路径'
                  name='url'
                  rules={[{ required: true, message: '请输入接口路径' }]}>
                  <Input placeholder='例如：/api/users/list' />
                </Form.Item>
                <Form.Item
                  label='请求方法'
                  name='method'
                  rules={[{ required: true, message: '请选择请求方法' }]}>
                  <Select allowClear options={METHOD_OPTIONS} placeholder='请选择请求方法' />
                </Form.Item>
              </>
            )}
            {/* {resourceType === 'menu' && (
              <Form.Item
                label='路由路径'
                name='url'
                className={styles['fullWidth']}
                rules={[{ required: true, message: '请输入菜单路由路径' }]}>
                <Input placeholder='例如：/system/user' />
              </Form.Item>
            )} */}
            {resourceType === 'button' && (
              <Form.Item label='使用说明' className={styles['fullWidth']}>
                <Input
                  value='按钮类型通常只需要名称、编码和父级关系即可。'
                  disabled
                  className={styles['hintInput']}
                />
              </Form.Item>
            )}
          </div>
        </div>

        <div className={styles['section']}>
          <SubTitle title='补充说明' className={styles['sectionTitle']} />
          <div className={styles['formGrid']}>
            <Form.Item label='备注' name='remark' className={styles['fullWidth']}>
              <Input.TextArea
                placeholder='可填写用途、权限说明或补充备注'
                rows={3}
                showCount
                maxLength={300}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </MyModal>
  );
}

export default forwardRef(ResourceFormModal);

interface Props {
  onSuccess?: () => unknown | Promise<unknown>;
}
