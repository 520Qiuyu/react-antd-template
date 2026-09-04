import { createContext } from 'react';
import type { TocSection } from '../../types';

interface NeteaseParseContextValue {
  tocSections: TocSection[];
  setTocSections: (sections: TocSection[]) => void;
}

const NeteaseParseContext = createContext<NeteaseParseContextValue | null>(null);

interface NeteaseParseProviderProps {
  children: React.ReactNode;
}

/**
 * 网易云解析页共享状态（当前 Tab、右侧目录）
 * @example
 * ```tsx
 * <NeteaseParseProvider>
 *   <NeteaseParseLayout />
 * </NeteaseParseProvider>
 * ```
 */
export const NeteaseParseProvider: React.FC<NeteaseParseProviderProps> = ({ children }) => {
  const [tocSections, setTocSections] = useState<TocSection[]>([]);

  const value = useMemo(() => ({ tocSections, setTocSections }), [tocSections]);

  return <NeteaseParseContext.Provider value={value}>{children}</NeteaseParseContext.Provider>;
};

/**
 * 读取网易云解析页共享状态
 * @example
 * ```ts
 * const { tocSections, setTocSections } = useNeteaseParseContext();
 * ```
 */
export const useNeteaseParseContext = () => {
  const context = useContext(NeteaseParseContext);
  if (!context) {
    throw new Error('useNeteaseParseContext 必须在 NeteaseParseProvider 内使用');
  }
  return context;
};
