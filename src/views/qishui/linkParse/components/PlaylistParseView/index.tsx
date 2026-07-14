import { PlusSquareOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { PlaylistInfo } from '@/types/qishui';
import { DEFAULT_PLAYLIST_LINK } from '../../constants';
import { MOCK_PLAYLIST } from '../../mock';
import { mockParseDelay } from '../../utils';
import DocSectionTitle from '../DocSectionTitle';
import ParseFormPanel from '../ParseFormPanel';
import PlaylistResult from '../PlaylistResult';
import { ParseEmptyState, ParseErrorState } from '../ParseState';
import styles from './index.module.less';

/**
 * 歌单解析视图
 */
const PlaylistParseView: React.FC = () => {
  const [link, setLink] = useState(DEFAULT_PLAYLIST_LINK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlaylistInfo | null>(null);

  const handleParse = async () => {
    if (!link.trim()) {
      setError('请先粘贴歌单分享链接');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    await mockParseDelay(820);
    setResult({ ...MOCK_PLAYLIST });
    setLoading(false);
  };

  const handleClear = () => {
    setLink('');
    setResult(null);
    setError('');
  };

  return (
    <main className={styles['doc']} data-page='playlist'>
      <div className={styles['badge']}>
        <PlusSquareOutlined /> Playlist Parse
      </div>
      <h1 className={styles['title']}>
        歌单解析 <em>Playlist</em>
      </h1>
      <p className={styles['lead']}>
        解析汽水歌单分享链接，展示歌单封面、创建者、曲目数量与完整歌曲列表，支持关键字快速筛选。
      </p>

      <DocSectionTitle id='playlist-input' first>
        输入链接
      </DocSectionTitle>
      <ParseFormPanel
        hint='请使用歌单分享链接；歌曲链接请切换到「歌曲解析」栏目。'
        label='分享链接'
        inputId='playlistLink'
        placeholder='粘贴汽水音乐歌单分享链接…'
        value={link}
        loading={loading}
        submitLabel='解析歌单'
        ariaLabel='歌单链接解析'
        onChange={setLink}
        onSubmit={handleParse}
        onClear={handleClear}
      />

      <DocSectionTitle id='playlist-result'>解析结果</DocSectionTitle>
      {!result && !error ? (
        <ParseEmptyState icon={<UnorderedListOutlined />}>歌单列表将显示在这里</ParseEmptyState>
      ) : null}
      <ParseErrorState message={error} />
      {result ? <PlaylistResult data={result} /> : null}
    </main>
  );
};

export default PlaylistParseView;
