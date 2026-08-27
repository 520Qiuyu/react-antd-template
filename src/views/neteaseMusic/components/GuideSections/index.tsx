import DocSectionTitle from '../DocSectionTitle';
import docStyles from '../doc.module.less';

/**
 * 如何获取分享链接 / 字段说明
 * @example
 * ```tsx
 * <GuideSections />
 * ```
 */
const GuideSections: React.FC = () => {
  return (
    <>
      <DocSectionTitle title='如何获取分享链接' id='guide-share'>
        <p className={docStyles['guideText']}>
          在网易云音乐 App 打开单曲、歌单、专辑或歌手页 → 分享 → 复制链接。可将整段文案直接粘贴到输入框。
        </p>
      </DocSectionTitle>
      <DocSectionTitle title='字段说明' id='guide-fields'>
        <p className={docStyles['guideText']}>
          单曲对齐 <code>title / artist / album / cover / urls / lrc</code>；歌单对齐{' '}
          <code>id / name / coverImgUrl / creator / trackCount / playCount / tags / songs</code>
          ；专辑对齐 <code>id / name / artist / publishTime / tracks</code>；歌手对齐{' '}
          <code>id / name / alias / hotSongs / albums</code>。
        </p>
      </DocSectionTitle>
    </>
  );
};

export default GuideSections;
