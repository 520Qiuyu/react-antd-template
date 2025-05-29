import { createFromIconfontCN } from '@ant-design/icons';
import type { IconFontProps } from '@ant-design/icons/lib/components/IconFont';

// https://ant.design/components/icon-cn#icon-demo-scripturl
const IconFont = createFromIconfontCN({
  scriptUrl: [
    '//at.alicdn.com/t/c/font_4654513_yeu27le284c.js', // https://www.iconfont.cn/collections/detail?cid=19238
  ],
});
function MyIcon(props: IconFontProps) {
  const { type, ...rest } = props;
  return <IconFont type={type.startsWith('icon-') ? type : 'icon-' + type} {...rest} />;
}
export default MyIcon;
