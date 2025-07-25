import type { ThemeConfig } from 'antd';

export const themeToken: ThemeConfig['token'] = {
  colorPrimary: '#31c27c',
};

export const themeComponentsToken: ThemeConfig['components'] = {
  Menu: {
    // https://ant.design/components/menu-cn#%E4%B8%BB%E9%A2%98%E5%8F%98%E9%87%8Fdesign-token
    activeBarBorderWidth: 0,
    activeBarWidth: 0,
    dropdownWidth: 200,
    iconSize: 16,
    itemActiveBg: 'rgba(68, 155, 255, 0.10)',
    iconMarginInlineEnd: 8,
    itemBorderRadius: 0,
    itemColor: 'rgba(0,0,0,0.65)',
    itemHeight: 48,
    itemHoverBg: 'rgba(68, 155, 255, 0.08)',
    itemHoverColor: 'rgba(0,0,0,0.55)',
    itemMarginBlock: 0,
    itemMarginInline: 0,
  },
};

export const theme: ThemeConfig = {
  token: themeToken,
  components: themeComponentsToken,
};
