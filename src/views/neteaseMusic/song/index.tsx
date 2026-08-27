import { CustomerServiceOutlined, StarOutlined } from '@ant-design/icons';
import DocSectionTitle from '../components/DocSectionTitle';
import ParsePageFrame from '../components/ParsePageFrame';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import { useNeteaseParse } from '../hooks/useNeteaseParse';
import { MOCK_SONG } from '../mock';
import type { TocSection } from '../types';
import SongResult, { SongLyricBox, SongQualityList } from './components/SongResult';

/**
 * 网易云单曲解析
 * @example
 * ```tsx
 * <NeteaseSongPage />
 * ```
 */
const NeteaseSongPage: React.FC = () => {
  const parse = useNeteaseParse({
    mock: MOCK_SONG,
    defaultLink: MODE_COPY.song.defaultLink,
    storageKey: 'netease-song-link',
    delay: 700,
  });

  const tocSections = useMemo<TocSection[]>(() => {
    const extra: TocSection[] = parse.result
      ? [
          { id: 'song-quality', label: '音质列表' },
          { id: 'song-lyric', label: '歌词' },
        ]
      : [];
    return [...BASE_TOC_SECTIONS, ...extra, ...GUIDE_TOC_SECTIONS];
  }, [parse.result]);

  return (
    <ParsePageFrame
      copy={MODE_COPY.song}
      badgeIcon={<StarOutlined />}
      emptyIcon={<CustomerServiceOutlined />}
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
          <SongResult data={parse.result} />
          <DocSectionTitle title='音质列表' id='song-quality'>
            <SongQualityList urls={parse.result.urls} />
          </DocSectionTitle>
          <DocSectionTitle title='歌词' id='song-lyric'>
            <SongLyricBox text={parse.result.lrcText || parse.result.lrc} />
          </DocSectionTitle>
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteaseSongPage;
