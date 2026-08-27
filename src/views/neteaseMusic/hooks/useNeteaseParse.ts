import { sleep } from '../utils';

interface UseNeteaseParseOptions<T> {
  mock: T;
  defaultLink: string;
  delay?: number;
  storageKey: string;
}

/**
 * 网易云解析页通用状态（当前为模拟解析）
 * @example
 * const parse = useNeteaseParse({
 *   mock: MOCK_SONG,
 *   defaultLink: MODE_COPY.song.defaultLink,
 *   storageKey: 'netease-song-link',
 * });
 */
export const useNeteaseParse = <T,>({
  mock,
  defaultLink,
  delay = 700,
  storageKey,
}: UseNeteaseParseOptions<T>) => {
  const [link, setLink] = useLocalStorageState<string>(storageKey, {
    defaultValue: defaultLink,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<T | null>(null);

  const handleParse = async () => {
    if (!link?.trim()) {
      setError('请先粘贴分享链接');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sleep(delay);
      setResult(mock);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLink('');
    setResult(null);
    setError('');
  };

  const handleLinkChange = (value: string) => {
    setLink(value);
  };

  return {
    link: link ?? '',
    setLink: handleLinkChange,
    loading,
    error,
    result,
    handleParse,
    handleClear,
  };
};
