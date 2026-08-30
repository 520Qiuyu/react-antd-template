import { reqParseNeteaseSong } from '@/apis';
import { SongLyricBox } from '@/components';
import { useSearchParams } from '@/hooks';
import { msgError } from '@/utils/modal';
import { CustomerServiceOutlined, StarOutlined } from '@ant-design/icons';
import DocSectionTitle from '../components/DocSectionTitle';
import ParsePageFrame from '../components/ParsePageFrame';
import { BASE_TOC_SECTIONS, GUIDE_TOC_SECTIONS, MODE_COPY } from '../constants';
import { useSongParseStore } from '../store/useSongParseStore';
import type { TocSection } from '../types';
import { mapNeteaseSongParseResult } from '../utils';
import SongResult, { SongQualityList } from './components/SongResult';

/**
 * 网易云单曲解析
 * @example
 * ```tsx
 * <NeteaseSongPage />
 * ```
 */
const NeteaseSongPage: React.FC = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  const [link, setLink] = useLocalStorageState<string>('netease-song-link', {
    defaultValue: MODE_COPY.song.defaultLink,
  });
  const { result, setResult } = useSongParseStore();

  /** 解析歌曲 */
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
        throw new Error('请先粘贴歌曲分享链接');
      }
      const res = await reqParseNeteaseSong({
        shareLink: link,
        cardSecret: searchParams.cardSecret,
      });
      if (res.code !== 200) {
        throw new Error(res.message || '解析失败');
      }
      const mapped = mapNeteaseSongParseResult(res.data);
      if (!mapped) {
        throw new Error('未解析到有效歌曲信息');
      }
      setResult(mapped);
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

  /** 获取目录项 */
  const tocSections = useMemo<TocSection[]>(() => {
    const extra: TocSection[] = result
      ? [
          { id: 'song-quality', label: '音质列表' },
          { id: 'song-lyric', label: '歌词' },
        ]
      : [];
    return [...BASE_TOC_SECTIONS, ...extra, ...GUIDE_TOC_SECTIONS];
  }, [result]);

  return (
    <ParsePageFrame
      copy={MODE_COPY.song}
      badgeIcon={<StarOutlined />}
      emptyIcon={<CustomerServiceOutlined />}
      tocSections={tocSections}
      link={link || ''}
      loading={loading}
      error={error}
      hasResult={Boolean(result)}
      onChange={setLink}
      onSubmit={handleParse}
      onClear={handleClear}>
      {result ? (
        <>
          <SongResult data={result} />
          <DocSectionTitle title='音质列表' id='song-quality'>
            <SongQualityList />
          </DocSectionTitle>
          <DocSectionTitle title='歌词' id='song-lyric'>
            <SongLyricBox
              theme='netease'
              lrc={result.lrc}
              lrcText={result.lrcText}
              filename={result.title}
            />
          </DocSectionTitle>
        </>
      ) : null}
    </ParsePageFrame>
  );
};

export default NeteaseSongPage;

export interface SearchParams {
  cardSecret?: string;
}
