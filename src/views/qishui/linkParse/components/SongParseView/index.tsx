import { reqParseSongShareLink } from '@/apis';
import { useSearchParams } from '@/hooks';
import { msgError } from '@/utils/modal';
import { CustomerServiceOutlined, StarOutlined } from '@ant-design/icons';
import type { SearchParams } from '../..';
import { DEFAULT_SONG_LINK } from '../../constants';
import { useLinkParseStore, type TocSection } from '../../store/useStore';
import DocSectionTitle from '../DocSectionTitle';
import ParseFormPanel from '../ParseFormPanel';
import { ParseEmptyState, ParseErrorState } from '../ParseState';
import SongResult, { SongLyricBox, SongQualityList } from '../SongResult';
import styles from './index.module.less';

interface SongParseViewProps {}

/**
 * 歌曲解析视图
 */
const SongParseView: React.FC<SongParseViewProps> = () => {
  const { searchParams } = useSearchParams<SearchParams>();
  const setSongHasResult = useLinkParseStore((state) => state.setSongHasResult);
  const songHasResult = useLinkParseStore((state) => state.songHasResult);
  const setTocSections = useLinkParseStore((state) => state.setTocSections);

  const [link, setLink] = useLocalStorageState<string>('song-link', {
    defaultValue: DEFAULT_SONG_LINK,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!link?.trim()) {
      setError('请先粘贴歌曲分享链接');
      setSongHasResult(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await reqParseSongShareLink({ shareLink: link.trim() });
      if (res.code !== 200) {
        setSongHasResult(null);
        setError(res.message || '解析失败');
        msgError(res.message || '解析失败');
        return;
      }

      const songInfo = res.data?.fullInfo || res.data?.musicInfo;
      if (!songInfo?.trackId) {
        setSongHasResult(null);
        setError('未解析到有效歌曲信息');
        return;
      }

      setSongHasResult(songInfo);
    } catch (err) {
      console.log('error', err);
      setSongHasResult(null);
      setError('解析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLink('');
    setSongHasResult(null);
    setError('');
  };

  useEffect(() => {
    if (searchParams.currentView === 'song') {
      const sections: TocSection[] = [
        { id: 'song-input', label: '输入链接' },
        { id: 'song-result', label: '解析结果' },
      ];
      if (songHasResult) {
        sections.push(
          { id: 'song-quality', label: '音质列表' },
          { id: 'song-lyric', label: '歌词' },
        );
      }
      sections.push(
        { id: 'guide-share', label: '如何获取分享链接' },
        { id: 'guide-fields', label: '字段说明' },
      );
      setTocSections(sections);
    }
  }, [searchParams.currentView, songHasResult]);

  return (
    <main className={styles['doc']} data-page='song'>
      <div className={styles['badge']}>
        <StarOutlined /> Song Parse
      </div>
      <h1 className={styles['title']}>
        歌曲解析 <em>Song</em>
      </h1>
      <p className={styles['lead']}>
        粘贴汽水音乐分享链接，一键提取封面、艺人、专辑、音质地址与歌词，结构清晰、便于后续下载与二次处理。
      </p>

      <DocSectionTitle id='song-input' first>
        输入链接
      </DocSectionTitle>
      <ParseFormPanel
        hint={
          <>
            支持完整分享文案或纯链接，例如：
            <code>《一点》@汽水音乐 https://qishui.douyin.com/s/…</code>
          </>
        }
        label='分享链接'
        inputId='songLink'
        placeholder='粘贴汽水音乐歌曲分享链接…'
        value={link!}
        loading={loading}
        submitLabel='解析歌曲'
        ariaLabel='歌曲链接解析'
        onChange={setLink}
        onSubmit={handleParse}
        onClear={handleClear}
      />

      <DocSectionTitle id='song-result'>解析结果</DocSectionTitle>
      {!songHasResult && !error ? (
        <ParseEmptyState icon={<CustomerServiceOutlined />}>解析结果将显示在这里</ParseEmptyState>
      ) : null}
      <ParseErrorState message={error} />
      {songHasResult ? (
        <>
          <SongResult data={songHasResult} />
          <DocSectionTitle id='song-quality'>音质列表</DocSectionTitle>
          <SongQualityList data={songHasResult} />
          <DocSectionTitle id='song-lyric'>歌词</DocSectionTitle>
          <SongLyricBox data={songHasResult} />
        </>
      ) : null}

      <DocSectionTitle id='guide-share'>如何获取分享链接</DocSectionTitle>
      <p className={styles['guideText']}>
        在汽水 App 打开歌曲 → 分享 → 复制链接。可将整段文案直接粘贴到输入框，原型会自动识别其中的
        URL。
      </p>

      <DocSectionTitle id='guide-fields'>字段说明</DocSectionTitle>
      <p className={styles['guideText']}>
        返回结构对齐后端 <code>MusicInfo</code>：title / artist / album / cover / urls / lrc
        等，便于前端直接消费。
      </p>
    </main>
  );
};

export default SongParseView;
