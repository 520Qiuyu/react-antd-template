import { UnorderedListOutlined } from '@ant-design/icons';
import ParsePageFrame from '../components/ParsePageFrame';
import TrackList from '../components/TrackList';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import { useNeteaseParse } from '../hooks/useNeteaseParse';
import { MOCK_PLAYLIST } from '../mock';
import PlaylistHero from './components/PlaylistHero';

/**
 * 网易云歌单解析
 * @example
 * ```tsx
 * <NeteasePlaylistPage />
 * ```
 */
const NeteasePlaylistPage: React.FC = () => {
  const parse = useNeteaseParse({
    mock: MOCK_PLAYLIST,
    defaultLink: MODE_COPY.playlist.defaultLink,
    storageKey: 'netease-playlist-link',
    delay: 780,
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
          <TrackList tracks={parse.result.tracks} filterAriaLabel='筛选歌单曲目' />
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteasePlaylistPage;
