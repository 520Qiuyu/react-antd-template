import { AppstoreOutlined } from '@ant-design/icons';
import ParsePageFrame from '../components/ParsePageFrame';
import TrackList from '../components/TrackList';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import { useNeteaseParse } from '../hooks/useNeteaseParse';
import { MOCK_ALBUM } from '../mock';
import AlbumHero from './components/AlbumHero';

/**
 * 网易云专辑解析
 * @example
 * ```tsx
 * <NeteaseAlbumPage />
 * ```
 */
const NeteaseAlbumPage: React.FC = () => {
  const parse = useNeteaseParse({
    mock: MOCK_ALBUM,
    defaultLink: MODE_COPY.album.defaultLink,
    storageKey: 'netease-album-link',
    delay: 780,
  });

  const tocSections = useMemo(() => [...BASE_TOC_SECTIONS, ...GUIDE_TOC_SECTIONS], []);

  return (
    <ParsePageFrame
      copy={MODE_COPY.album}
      badgeIcon={<AppstoreOutlined />}
      emptyIcon={<AppstoreOutlined />}
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
          <AlbumHero data={parse.result} />
          <TrackList tracks={parse.result.tracks} />
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteaseAlbumPage;
