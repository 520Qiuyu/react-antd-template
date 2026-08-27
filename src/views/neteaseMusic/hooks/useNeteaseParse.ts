import { sleep } from '../utils';

type UseNeteaseParseOptions<T> = {
  defaultLink: string;
  delay?: number;
  storageKey: string;
} & (
  | {
      mock: T;
      fetcher?: never;
    }
  | {
      mock?: never;
      fetcher: (shareLink: string) => Promise<T>;
    }
);

/**
 * 网易云解析页通用状态
 * @example
 * ```ts
 * const parse = useNeteaseParse({
 *   mock: MOCK_SONG,
 *   defaultLink: MODE_COPY.song.defaultLink,
 *   storageKey: 'netease-song-link',
 * });
 * ```
 */
export const useNeteaseParse = <T,>({
  mock,
  fetcher,
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
      if (fetcher) {
        const data = await fetcher(link.trim());
        setResult(data);
        return;
      }
      await sleep(delay);
      setResult(mock);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : '解析失败，请稍后重试');
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
