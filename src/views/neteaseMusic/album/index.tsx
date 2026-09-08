import { reqParseNeteaseAlbum } from '@/apis';
import { useSearchParams } from '@/hooks';
import { msgError } from '@/utils/modal';
import { AppstoreOutlined } from '@ant-design/icons';
import ParsePageFrame from '../components/ParsePageFrame';
import TrackList from '../components/TrackList';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import type { SearchParams } from '../song';
import { useAlbumParseStore } from '../store/useAlbumParseStore';
import AlbumHero from './components/AlbumHero';

/**
 * 网易云专辑解析
 * @example
 * ```tsx
 * <NeteaseAlbumPage />
 * ```
 */
const NeteaseAlbumPage: React.FC = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  const [link, setLink] = useLocalStorageState<string>('netease-album-link', {
    defaultValue: MODE_COPY.album.defaultLink,
  });

  const { result, setResult } = useAlbumParseStore();

  /** 解析专辑 */
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
        throw new Error('请先粘贴专辑分享链接');
      }
      const res = await reqParseNeteaseAlbum({
        shareLink: link,
        cardSecret: searchParams.cardSecret,
      });
      if (res.code !== 200) {
        throw new Error(res.message || '解析失败');
      }
      if (!res.data?.album?.id) {
        throw new Error('未解析到有效专辑信息');
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
  const album = result?.album;
  const songs = result?.songs || [];
  const privileges = result?.privileges;

  return (
    <ParsePageFrame
      copy={MODE_COPY.album}
      badgeIcon={<AppstoreOutlined />}
      emptyIcon={<AppstoreOutlined />}
      tocSections={tocSections}
      link={link || ''}
      loading={loading}
      error={error}
      hasResult={Boolean(album)}
      onChange={setLink}
      onSubmit={handleParse}
      onClear={handleClear}>
      {album ? (
        <>
          <AlbumHero data={album} />
          <TrackList
            tracks={songs}
            privileges={privileges}
            source='album'
            collectionTitle={album.name}
          />
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteaseAlbumPage;
