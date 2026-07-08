import type { Ref } from '@/hooks/useVisible';
import type { PermissionResourceItem } from '@/types/permission';
import { Segmented } from 'antd';
import ResourceFormModal from './components/ResourceFormModal';
import ResourceListView from './components/ResourceListView';
import ResourceTreeView from './components/ResourceTreeView';
import { RESOURCE_VIEW_OPTIONS, type ResourceViewMode } from './constants';
import styles from './index.module.less';

const ResourceManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ResourceViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const formModalRef = useRef<Ref<void, PermissionResourceItem | void>>(null);

  const handleSuccess = () => {
    setRefreshKey((key) => key + 1);
  };

  return (
    <div className={styles['page']}>
      <div className={styles['header']}>
        <Segmented<ResourceViewMode>
          value={viewMode}
          options={RESOURCE_VIEW_OPTIONS}
          onChange={setViewMode}
        />
      </div>
      {viewMode === 'list' ? (
        <ResourceListView formModalRef={formModalRef} refreshKey={refreshKey} />
      ) : (
        <ResourceTreeView formModalRef={formModalRef} refreshKey={refreshKey} />
      )}
      <ResourceFormModal ref={formModalRef} onSuccess={handleSuccess} />
    </div>
  );
};

export default ResourceManagement;
