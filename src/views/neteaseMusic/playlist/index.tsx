import { reqParseNeteasePlaylist } from '@/apis';
import { useSearchParams } from '@/hooks';
import { msgError } from '@/utils/modal';
import { UnorderedListOutlined } from '@ant-design/icons';
import ParsePageFrame from '../components/ParsePageFrame';
import TrackList from '../components/TrackList';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import type { SearchParams } from '../song';
import { usePlaylistParseStore } from '../store/usePlaylistParseStore';
import PlaylistHero from './components/PlaylistHero';

/**
 * 网易云歌单解析
 * @example
 * ```tsx
 * <NeteasePlaylistPage />
 * ```
 */
const NeteasePlaylistPage: React.FC = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  const [link, setLink] = useLocalStorageState<string>('netease-playlist-link', {
    defaultValue: MODE_COPY.playlist.defaultLink,
  });

  const { result, setResult } = usePlaylistParseStore();

  /** 解析歌单 */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleParse = async () => {
    try {
      setLoading(true);
      if (!searchParams.cardSecret) {
        return msgError('请先绑定卡密');
      }
      setError('');
      if (!link?.trim()) {
        throw new Error('请先粘贴歌单分享链接');
      }
      const res = await reqParseNeteasePlaylist({
        shareLink: link,
        cardSecret: searchParams.cardSecret,
      });
      if (res.code !== 200) {
        throw new Error(res.message || '解析失败');
      }
      if (!res.data?.detail?.playlist?.id) {
        throw new Error('未解析到有效歌单信息');
      }
      setResult(res.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '解析失败');
    } finally {
      setLoading(false);
    }
  };

  /** 清空 */
  const handleClear = () => {
    setLink('');
    setResult(null);
  };

  const tocSections = useMemo(() => [...BASE_TOC_SECTIONS, ...GUIDE_TOC_SECTIONS], []);
  const playlist = result?.detail?.playlist;
  const songs = result?.all?.songs?.length ? result.all.songs : playlist?.tracks || [];
  const privileges = result?.all?.privileges?.length
    ? result.all.privileges
    : result?.detail?.privileges;

  return (
    <ParsePageFrame
      copy={MODE_COPY.playlist}
      badgeIcon={<UnorderedListOutlined />}
      emptyIcon={<UnorderedListOutlined />}
      tocSections={tocSections}
      link={link || ''}
      loading={loading}
      error={error}
      hasResult={Boolean(playlist)}
      onChange={setLink}
      onSubmit={handleParse}
      onClear={handleClear}>
      {playlist ? (
        <>
          <PlaylistHero data={playlist} />
          <TrackList tracks={songs} privileges={privileges} />
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteasePlaylistPage;
