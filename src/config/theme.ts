import type { ThemeConfig } from 'antd';

export const themeToken: ThemeConfig['token'] = {
  // Apple 风（接近 iOS 系统蓝）
  colorPrimary: '#007AFF',
  colorInfo: '#007AFF',

  // 基础排版（优先系统 SF / Segoe）
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif',

  // 圆角体系（更接近 iOS/macOS）
  borderRadius: 14,
  borderRadiusLG: 18,
  borderRadiusSM: 10,

  // 背景/容器色（偏“雾面玻璃”的浅底）
/*   colorBgLayout: 'rgba(246, 247, 250, 1)',
  colorBgContainer: 'rgba(255, 255, 255, 0.78)',
  colorBgElevated: 'rgba(255, 255, 255, 0.86)', */

  // 边框与文本
  colorBorder: 'rgba(0, 0, 0, 0.08)',
  colorText: 'rgba(0, 0, 0, 0.86)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.55)',
  colorTextTertiary: 'rgba(0, 0, 0, 0.38)',

  // 阴影（更柔和）
  boxShadow:
    '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset',
};

export const themeComponentsToken: ThemeConfig['components'] = {
  Menu: {
    // https://ant.design/components/menu-cn#%E4%B8%BB%E9%A2%98%E5%8F%98%E9%87%8Fdesign-token
    activeBarBorderWidth: 0,
    activeBarWidth: 0,
    dropdownWidth: 200,
    iconSize: 16,
    itemActiveBg: 'rgba(0, 122, 255, 0.10)',
    iconMarginInlineEnd: 8,
    itemBorderRadius: 12,
    itemColor: 'rgba(0,0,0,0.78)',
    itemHeight: 42,
    itemHoverBg: 'rgba(0, 0, 0, 0.04)',
    itemHoverColor: 'rgba(0,0,0,0.92)',
    itemMarginBlock: 4,
    itemMarginInline: 0,
    itemSelectedBg: 'rgba(0, 122, 255, 0.12)',
    itemSelectedColor: 'rgba(0,0,0,0.92)',
  },
  Layout: {
    bodyBg: 'transparent',
    headerBg: 'transparent',
    siderBg: 'transparent',
  },
};

export const theme: ThemeConfig = {
  token: themeToken,
  components: themeComponentsToken,
};
