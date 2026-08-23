import { reqParseSongShareLink } from '@/apis';
import { useSearchParams } from '@/hooks';
import { confirm, msgError } from '@/utils/modal';
import { CustomerServiceOutlined, StarOutlined } from '@ant-design/icons';
import type { SearchParams } from '../..';
import { DEFAULT_SONG_LINK } from '../../constants';
import { useParseStore, useSongParseStore, type TocSection } from '../../store';
import DocSectionTitle from '../DocSectionTitle';
import ParseFormPanel from '../ParseFormPanel';
import { ParseEmptyState, ParseErrorState } from '../ParseState';
import SongResult, { SongLyricBox, SongQualityList } from '../SongResult';
import styles from './index.module.less';
import eventBus from '@/utils/eventBus';

interface SongParseViewProps {}

/**
 * 歌曲解析视图
 */
const SongParseView: React.FC<SongParseViewProps> = () => {
  const { searchParams, setSearchParams } = useSearchParams<SearchParams>();
  const setSongHasResult = useSongParseStore((state) => state.setSongHasResult);
  const songHasResult = useSongParseStore((state) => state.songHasResult);
  const setTocSections = useParseStore((state) => state.setTocSections);

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

    // 判断歌单
    if (link.includes('歌单')) {
      try {
        await confirm(`检测到当前链接为【歌单链接】，是否继续解析？`, '提示', {
          okText: '前往歌单解析',
          cancelText: '继续解析',
          wrapClassName: 'confirmWrap',
          okButtonProps: {
            type: 'primary',
            className: 'confirmOk',
          },
          cancelButtonProps: {
            type: 'default',
            className: 'confirmCancel',
          },
        });
        return setSearchParams({ ...searchParams, currentView: 'playlist' });
      } catch (error) {
        console.log('error', error);
      }
    }

    setLoading(true);
    setError('');
    try {
      const res = await reqParseSongShareLink({
        shareLink: link.trim(),
        cardSecret: searchParams.cardSecret!,
      });
      if (res.code !== 200) {
        setSongHasResult(null);
        setError(res.message || '解析失败');
        return;
      }

      const songInfo = res.data?.fullInfo || res.data?.musicInfo;
      if (!songInfo?.trackId) {
        setSongHasResult(null);
        setError('未解析到有效歌曲信息');
        return;
      }

      setSongHasResult(songInfo);
      eventBus.emit('cardSecretRefresh');
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

      <DocSectionTitle title='输入链接' id='song-input' first>
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
      </DocSectionTitle>

      <DocSectionTitle title='解析结果' id='song-result'>
        {!songHasResult && !error ? (
          <ParseEmptyState icon={<CustomerServiceOutlined />}>解析结果将显示在这里</ParseEmptyState>
        ) : null}
        <ParseErrorState message={error} />

        {songHasResult ? (
          <>
            <SongResult data={songHasResult} />

            <DocSectionTitle title='音质列表' id='song-quality'>
              <SongQualityList data={songHasResult} />
            </DocSectionTitle>

            <DocSectionTitle title='歌词' id='song-lyric'>
              <SongLyricBox data={songHasResult} />
            </DocSectionTitle>
          </>
        ) : null}
      </DocSectionTitle>

      <DocSectionTitle title='如何获取分享链接' id='guide-share'>
        <p className={styles['guideText']}>
          在汽水 App 打开歌曲 → 分享 → 复制链接。可将整段文案直接粘贴到输入框，原型会自动识别其中的
          URL。
        </p>
      </DocSectionTitle>

      <DocSectionTitle title='字段说明' id='guide-fields'>
        <p className={styles['guideText']}>
          返回结构对齐后端 <code>MusicInfo</code>：title / artist / album / cover / urls / lrc
          等，便于前端直接消费。
        </p>
      </DocSectionTitle>
    </main>
  );
};

export default SongParseView;
