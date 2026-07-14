import { CustomerServiceOutlined, StarOutlined } from '@ant-design/icons';
import type { MusicInfo } from '@/types/qishui';
import { DEFAULT_SONG_LINK } from '../../constants';
import { MOCK_SONG } from '../../mock';
import { mockParseDelay } from '../../utils';
import DocSectionTitle from '../DocSectionTitle';
import ParseFormPanel from '../ParseFormPanel';
import { ParseEmptyState, ParseErrorState } from '../ParseState';
import SongResult, { SongLyricBox, SongQualityList } from '../SongResult';
import styles from './index.module.less';

interface SongParseViewProps {
  onResultChange?: (hasResult: boolean) => void;
}

/**
 * 歌曲解析视图
 */
const SongParseView: React.FC<SongParseViewProps> = ({ onResultChange }) => {
  const [link, setLink] = useState(DEFAULT_SONG_LINK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MusicInfo | null>(null);

  useEffect(() => {
    onResultChange?.(!!result);
  }, [result, onResultChange]);

  const handleParse = async () => {
    if (!link.trim()) {
      setError('请先粘贴歌曲分享链接');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    await mockParseDelay(720);
    setResult({ ...MOCK_SONG });
    setLoading(false);
  };

  const handleClear = () => {
    setLink('');
    setResult(null);
    setError('');
  };

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
        value={link}
        loading={loading}
        submitLabel='解析歌曲'
        ariaLabel='歌曲链接解析'
        onChange={setLink}
        onSubmit={handleParse}
        onClear={handleClear}
      />

      <DocSectionTitle id='song-result'>解析结果</DocSectionTitle>
      {!result && !error ? (
        <ParseEmptyState icon={<CustomerServiceOutlined />}>解析结果将显示在这里</ParseEmptyState>
      ) : null}
      <ParseErrorState message={error} />
      {result ? (
        <>
          <SongResult data={result} />
          <DocSectionTitle id='song-quality'>音质列表</DocSectionTitle>
          <SongQualityList data={result} />
          <DocSectionTitle id='song-lyric'>歌词</DocSectionTitle>
          <SongLyricBox data={result} />
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
