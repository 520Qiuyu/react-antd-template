import NeteaseParseLayout from '../components/NeteaseParseLayout';
import { NeteaseParseProvider, useNeteaseParseContext } from '../components/NeteaseParseContext';
import AlbumPage from '../album';
import ArtistPage from '../artist';
import PlaylistPage from '../playlist';
import SongPage from '../song';

/**
 * 按当前 Tab 渲染对应解析组件
 */
const NeteaseParseViews: React.FC = () => {
  const { mode } = useNeteaseParseContext();

  if (mode === 'playlist') return <PlaylistPage />;
  if (mode === 'album') return <AlbumPage />;
  if (mode === 'artist') return <ArtistPage />;
  return <SongPage />;
};

/**
 * 网易云音乐解析（单路由，Tab 切换组件）
 * @example
 * ```tsx
 * <NeteaseMusicParse />
 * ```
 */
const NeteaseMusicParse: React.FC = () => {
  return (
    <NeteaseParseProvider>
      <NeteaseParseLayout>
        <NeteaseParseViews />
      </NeteaseParseLayout>
    </NeteaseParseProvider>
  );
};

export default NeteaseMusicParse;
