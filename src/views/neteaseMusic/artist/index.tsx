import { UserOutlined } from '@ant-design/icons';
import DocSectionTitle from '../components/DocSectionTitle';
import ParsePageFrame from '../components/ParsePageFrame';
import TrackList from '../components/TrackList';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import { useNeteaseParse } from '../hooks/useNeteaseParse';
import { MOCK_ARTIST } from '../mock';
import type { TocSection } from '../types';
import AlbumGrid from './components/AlbumGrid';
import ArtistHero from './components/ArtistHero';

/**
 * 网易云歌手解析
 * @example
 * ```tsx
 * <NeteaseArtistPage />
 * ```
 */
const NeteaseArtistPage: React.FC = () => {
  const parse = useNeteaseParse({
    mock: MOCK_ARTIST,
    defaultLink: MODE_COPY.artist.defaultLink,
    storageKey: 'netease-artist-link',
    delay: 780,
  });

  const tocSections = useMemo<TocSection[]>(() => {
    const extra: TocSection[] = parse.result
      ? [
          { id: 'artist-hotsongs', label: '热门歌曲' },
          { id: 'artist-albums', label: '专辑' },
        ]
      : [];
    return [...BASE_TOC_SECTIONS, ...extra, ...GUIDE_TOC_SECTIONS];
  }, [parse.result]);

  return (
    <ParsePageFrame
      copy={MODE_COPY.artist}
      badgeIcon={<UserOutlined />}
      emptyIcon={<UserOutlined />}
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
          <ArtistHero data={parse.result} />
          <DocSectionTitle title='热门歌曲' id='artist-hotsongs'>
            <TrackList
              tracks={parse.result.hotSongs}
              filterPlaceholder='筛选热门歌曲…'
              filterAriaLabel='筛选热门歌曲'
            />
          </DocSectionTitle>
          <DocSectionTitle title='专辑' id='artist-albums'>
            <AlbumGrid albums={parse.result.albums} />
          </DocSectionTitle>
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteaseArtistPage;
