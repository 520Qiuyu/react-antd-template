import {
  AppstoreOutlined,
  CustomerServiceOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { NETEASE_MODES } from '../../constants';
import type { NeteaseParseMode } from '../../types';
import { useNeteaseParseContext } from '../NeteaseParseContext';
import styles from './index.module.less';
import { useSearchParams } from '@/hooks';
import type { SearchParams } from '../..';

const MODE_ITEMS: Array<{
  mode: NeteaseParseMode;
  label: string;
  icon: React.ReactNode;
}> = [
  { mode: 'song', label: '单曲', icon: <CustomerServiceOutlined /> },
  { mode: 'playlist', label: '歌单', icon: <UnorderedListOutlined /> },
  { mode: 'album', label: '专辑', icon: <AppstoreOutlined /> },
  { mode: 'artist', label: '歌手', icon: <UserOutlined /> },
];

/**
 * 解析类型切换（同页 Tab）
 * @example
 * ```tsx
 * <ModeSegment />
 * ```
 */
const ModeSegment: React.FC = () => {
  const { searchParams, setSearchParams } = useSearchParams<SearchParams>();

  const handleSelect = (mode: NeteaseParseMode) => {
    if (mode === searchParams.currentView) return;
    setSearchParams({ ...searchParams, currentView: mode });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const index = NETEASE_MODES.indexOf(searchParams.currentView);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = NETEASE_MODES[(index + delta + NETEASE_MODES.length) % NETEASE_MODES.length];
    handleSelect(next);
  };

  return (
    <div
      className={styles['segment']}
      role='tablist'
      aria-label='解析类型'
      onKeyDown={handleKeyDown}>
      {MODE_ITEMS.map((item) => {
        const active = item.mode === searchParams.currentView;
        return (
          <button
            key={item.mode}
            className={classNames(styles['item'], { [styles['isActive']]: active })}
            type='button'
            role='tab'
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => handleSelect(item.mode)}>
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSegment;
