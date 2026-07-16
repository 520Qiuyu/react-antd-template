import { reqParsePlaylistShareLink } from '@/apis';
import { useSearchParams } from '@/hooks';
import { PlusSquareOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { SearchParams } from '../..';
import { DEFAULT_PLAYLIST_LINK } from '../../constants';
import { useParseStore, usePlaylistParseStore, type TocSection } from '../../store';
import DocSectionTitle from '../DocSectionTitle';
import ParseFormPanel from '../ParseFormPanel';
import { ParseEmptyState, ParseErrorState } from '../ParseState';
import PlaylistResult from '../PlaylistResult';
import styles from './index.module.less';

/**
 * 歌单解析视图
 */
const PlaylistParseView: React.FC = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  /** 设置歌单解析结果 */
  const setPlaylistHasResult = usePlaylistParseStore((state) => state.setPlaylistHasResult);
  /** 歌单解析结果 */
  const playlistHasResult = usePlaylistParseStore((state) => state.playlistHasResult);
  /** 设置右侧目录 */
  const setTocSections = useParseStore((state) => state.setTocSections);

  const [link, setLink] = useLocalStorageState<string>('playlist-link', {
    defaultValue: DEFAULT_PLAYLIST_LINK,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** 解析歌单 */
  const handleParse = async () => {
    if (!link?.trim()) {
      setError('请先粘贴歌单分享链接');
      setPlaylistHasResult(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await reqParsePlaylistShareLink({ shareLink: link.trim() });
      if (res.code !== 200) {
        setPlaylistHasResult(null);
        setError(res.message || '解析失败');
        return;
      }

      const playlistInfo = res.data?.routerData;
      if (!playlistInfo?.title) {
        setPlaylistHasResult(null);
        setError('未解析到有效歌单信息');
        return;
      }

      setPlaylistHasResult(playlistInfo);
    } catch (err) {
      console.log('error', err);
      setPlaylistHasResult(null);
      setError('解析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLink('');
    setPlaylistHasResult(null);
    setError('');
  };

  useEffect(() => {
    if (searchParams.currentView === 'playlist') {
      const sections: TocSection[] = [
        { id: 'playlist-input', label: '输入链接' },
        { id: 'playlist-result', label: '解析结果' },
      ];
      setTocSections(sections);
    }
  }, [searchParams.currentView, playlistHasResult]);

  return (
    <main className={styles['doc']} data-page='playlist'>
      {/* 头部标题 */}
      <header>
        <div className={styles['badge']}>
          <PlusSquareOutlined /> Playlist Parse
        </div>
        <h1 className={styles['title']}>
          歌单解析 <em>Playlist</em>
        </h1>
        <p className={styles['lead']}>
          解析汽水歌单分享链接，展示歌单封面、创建者、曲目数量与完整歌曲列表，支持关键字快速筛选。
        </p>
      </header>

      <DocSectionTitle title='输入链接' id='playlist-input' first>
        <ParseFormPanel
          hint='请使用歌单分享链接；歌曲链接请切换到「歌曲解析」栏目。'
          label='分享链接'
          inputId='playlistLink'
          placeholder='粘贴汽水音乐歌单分享链接…'
          value={link!}
          loading={loading}
          submitLabel='解析歌单'
          ariaLabel='歌单链接解析'
          onChange={setLink}
          onSubmit={handleParse}
          onClear={handleClear}
        />
      </DocSectionTitle>

      <DocSectionTitle title='解析结果' id='playlist-result'>
        {!playlistHasResult && !error ? (
          <ParseEmptyState icon={<UnorderedListOutlined />}>歌单列表将显示在这里</ParseEmptyState>
        ) : null}
        <ParseErrorState message={error} />
        {playlistHasResult ? <PlaylistResult data={playlistHasResult} /> : null}
      </DocSectionTitle>
    </main>
  );
};

export default PlaylistParseView;
