import { reqParseNeteasePlaylist } from '@/apis';
import { UnorderedListOutlined } from '@ant-design/icons';
import ParsePageFrame from '../components/ParsePageFrame';
import TrackList from '../components/TrackList';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import { useNeteaseParse } from '../hooks/useNeteaseParse';
import type { NeteasePlaylistInfo } from '../types';
import { mapNeteasePlaylistParseResult } from '../utils';
import PlaylistHero from './components/PlaylistHero';

/**
 * 网易云歌单解析
 * @example
 * ```tsx
 * <NeteasePlaylistPage />
 * ```
 */
const NeteasePlaylistPage: React.FC = () => {
  const parse = useNeteaseParse<NeteasePlaylistInfo>({
    defaultLink: MODE_COPY.playlist.defaultLink,
    storageKey: 'netease-playlist-link',
    fetcher: async (shareLink) => {
      const res = await reqParseNeteasePlaylist({ shareLink });
      if (res.code !== 200) {
        throw new Error(res.message || '解析失败');
      }
      const mapped = mapNeteasePlaylistParseResult(res.data);
      if (!mapped) {
        throw new Error('未解析到有效歌单信息');
      }
      return mapped;
    },
  });

  const tocSections = useMemo(
    () => [...BASE_TOC_SECTIONS, ...GUIDE_TOC_SECTIONS],
    [],
  );

  return (
    <ParsePageFrame
      copy={MODE_COPY.playlist}
      badgeIcon={<UnorderedListOutlined />}
      emptyIcon={<UnorderedListOutlined />}
      tocSections={tocSections}
      link={parse.link}
      loading={parse.loading}
      error={parse.error}
      hasResult={Boolean(parse.result)}
      onChange={parse.setLink}
      onSubmit={parse.handleParse}
      onClear={parse.handleClear}>
      {parse.result ? (
        <>
          <PlaylistHero data={parse.result} />
          <TrackList tracks={parse.result.tracks} />
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteasePlaylistPage;
