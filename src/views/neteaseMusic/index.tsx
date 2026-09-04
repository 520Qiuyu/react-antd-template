import { useSearchParams } from '@/hooks';
import AlbumPage from './album';
import ArtistPage from './artist';
import { NeteaseParseProvider } from './components/NeteaseParseContext';
import NeteaseParseLayout from './components/NeteaseParseLayout';
import PlaylistPage from './playlist';
import SongPage from './song';
import type { NeteaseParseMode } from './types';

const defaultSearchParams: SearchParams = {
  currentView: 'song',
};

const VIEW_MAP: Record<NeteaseParseMode, React.FC> = {
  song: SongPage,
  playlist: PlaylistPage,
  album: AlbumPage,
  artist: ArtistPage,
};

/**
 * 网易云音乐解析（单路由，Tab 切换组件）
 * @example
 * ```tsx
 * <NeteaseMusicParse />
 * ```
 */
const NeteaseMusicParse: React.FC = () => {
  const { searchParams } = useSearchParams(defaultSearchParams);
  const View = VIEW_MAP[searchParams.currentView] || SongPage;

  return (
    <NeteaseParseProvider>
      <NeteaseParseLayout>
        <View />
      </NeteaseParseLayout>
    </NeteaseParseProvider>
  );
};

export default NeteaseMusicParse;

export interface SearchParams {
  currentView: NeteaseParseMode;
  cardSecret?: string;
}
