import type { NeteaseModeCopy, TocSection } from '../../types';
import { useNeteaseParseContext } from '../NeteaseParseContext';
import DocSectionTitle from '../DocSectionTitle';
import GuideSections from '../GuideSections';
import ModeSegment from '../ModeSegment';
import ParseFormPanel from '../ParseFormPanel';
import { ParseEmptyState, ParseErrorState } from '../ParseState';
import docStyles from '../doc.module.less';

interface ParsePageFrameProps {
  copy: NeteaseModeCopy;
  badgeIcon: React.ReactNode;
  emptyIcon: React.ReactNode;
  tocSections: TocSection[];
  link: string;
  loading: boolean;
  error: string;
  hasResult: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  children?: React.ReactNode;
}

/**
 * 四个解析视图共用的文档骨架
 * @example
 * ```tsx
 * <ParsePageFrame copy={MODE_COPY.song} ...>
 *   <SongResult data={result} />
 * </ParsePageFrame>
 * ```
 */
const ParsePageFrame: React.FC<ParsePageFrameProps> = ({
  copy,
  badgeIcon,
  emptyIcon,
  tocSections,
  link,
  loading,
  error,
  hasResult,
  onChange,
  onSubmit,
  onClear,
  children,
}) => {
  const { setTocSections } = useNeteaseParseContext();

  useEffect(() => {
    setTocSections(tocSections);
  }, [setTocSections, tocSections]);

  return (
    <main className={docStyles['doc']}>
      <div className={docStyles['badge']}>
        {badgeIcon}
        {copy.badge}
      </div>
      <h1 className={docStyles['title']}>
        {copy.title} <em>{copy.titleEn}</em>
      </h1>
      <p className={docStyles['lead']}>{copy.lead}</p>

      <DocSectionTitle title='输入链接' id='parse-input' first>
        <ParseFormPanel
          header={<ModeSegment />}
          hint={copy.hint}
          label='分享链接'
          inputId='parseLink'
          placeholder={copy.placeholder}
          value={link}
          loading={loading}
          submitLabel={copy.parseLabel}
          ariaLabel={copy.inputAria}
          onChange={onChange}
          onSubmit={onSubmit}
          onClear={onClear}
        />
      </DocSectionTitle>

      <DocSectionTitle title='解析结果' id='parse-result'>
        {!hasResult && !error ? (
          <ParseEmptyState icon={emptyIcon}>{copy.emptyText}</ParseEmptyState>
        ) : null}
        <ParseErrorState message={error} />
        {hasResult ? <div className={docStyles['result']}>{children}</div> : null}
      </DocSectionTitle>

      <GuideSections />
    </main>
  );
};

export default ParsePageFrame;
