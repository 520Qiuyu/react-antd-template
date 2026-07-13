import MyIcon from '@/components/MyIcon';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';
import { getRoutesList } from '@/router/menu';
import { useAppStore, useUserStore } from '@/store';
import { hasAuthority } from '@/utils/userInfo';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import classNames from 'classnames';
import { useDrag } from '../hooks/useDrag';
import styles from './index.module.less';

export default function Sider() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const currentRoute = useCurrentRoute();
  const addTab = useAppStore((state) => state.addTab);
  const userInfo = useUserStore((state) => state.userInfo);

  // 折叠
  const [collapsed, setCollapsed] = useState(false);
  // 侧边栏宽度
  const [width, setWidth] = useLocalStorageState('menuWidth', {
    defaultValue: 200,
  });
  const { isDragging, handleMouseDown } = useDrag({
    onDrag: (newWidth) => {
      if (!collapsed) {
        setWidth(newWidth);
      }
    },
  });

  /** 菜单配置项 */
  const items = useMemo(() => {
    const routes = getRoutesList();
    const result = format(routes);
    console.log('result', result);
    return result;

    /**
     * 1、过滤隐藏的路由 路由中配置hidden为true的路由不显示在菜单中
     * 2、过滤没有权限的路由 路由中配置auth的路由需要权限校验后才能访问
     * 3、过滤没有子路由的路由 路由中没有children的路由不显示子菜单
     * 4、icon最兼容性处理 在配置中icon为string或reactNode的路由显示在菜单中
     * 5、将路由name映射为label
     */
    function format(routes: IFormatMenu[]) {
      return routes.filter((route) => {
        // 是否隐藏
        const isHidden = route.hidden;
        const isPermission = route.auth ? hasAuthority(route.auth) : true;
        const shouldAdd = !isHidden && isPermission;
        route.icon = typeof route.icon === 'string' ? <MyIcon type={route.icon} /> : route.icon;
        route.label = route.name;
        if (shouldAdd && route.children?.length) {
          route.children = format(route.children as IFormatMenu[]);
          if (route.children?.length === 0) {
            route.children = route.component ? undefined : [];
          }
        }
        return shouldAdd;
      });
    }
  }, [userInfo]);

  const getFirstRoute = (routes: IFormatMenu[]) => {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].component) return routes[i];
      if (routes[i].children?.length) {
        const fr = getFirstRoute(routes[i].children as IFormatMenu[]);
        if (fr) return fr;
      }
    }
  };
  // 跳转到第一个菜单
  useEffect(() => {
    // 进入到根路径，自动跳转到第一项菜单
    if (['', '/'].includes(pathname)) {
      const firstRoute = getFirstRoute(items);
      console.log('firstRoute', firstRoute);
      if (!firstRoute) return;
      // 第一个路由为根路径，不跳转
      if (['', '/'].includes(firstRoute.path)) return;
      // TOFIX: 有一个意外的跳转，后续在修复
      setTimeout(() => {
        navigate(firstRoute.path, { replace: true });
      }, 0);
      addTab({
        key: firstRoute.key,
        path: firstRoute.path,
        title: firstRoute.name,
        fullPath: firstRoute.path,
      });
    }
  }, [pathname]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    /**
     * 1、跳转到指定路由
     * 2、添加到标签页
     */
    console.log('click ', e);
    const { key, item } = e!;
    navigate(key);
    addTab({
      key: key,
      // @ts-ignore
      title: item.props.name,
      path: key,
      // @ts-ignore
      fullPath: item.props.path,
    });
  };

  const [selectedKeys, setSelectedKeys] = useState([currentRoute?.key || '']);
  const [openKeys, setOpenKeys] = useState<string[]>(currentRoute?.indexKey || []);
  useEffect(() => {
    setSelectedKeys([currentRoute?.key || '']);
    setOpenKeys([...openKeys, ...(currentRoute?.indexKey || [])]);
  }, [currentRoute]);

  return (
    <Layout.Sider
      className={classNames(styles['sider'], {
        [styles['is-dragging']]: isDragging,
      })}
      theme='light'
      breakpoint='lg'
      collapsible
      collapsed={collapsed}
      onCollapse={(collapsed) => setCollapsed(collapsed)}
      width={width}
      trigger={null}>
      {/* 拖拽调整大小分割线 */}
      <div
        className={classNames(styles['sider-drag-line'], {
          [styles['disabled']]: collapsed,
          [styles['is-dragging']]: !collapsed && isDragging,
        })}
        onMouseDown={handleMouseDown}
      />
      {/* 菜单 */}
      <Menu
        items={items}
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        inlineCollapsed={collapsed}
        onClick={handleMenuClick}
        onOpenChange={setOpenKeys}
        onSelect={({ key }) => {
          setSelectedKeys([key]);
        }}
        mode='inline'
      />
      {/* 收缩展开按钮 */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className={classNames(styles['collapsed-btn'], {
          [styles['is-collapsed']]: collapsed,
          [styles['is-hide']]: !collapsed && isDragging,
        })}>
        {!collapsed ? <LeftOutlined /> : <RightOutlined />}
      </div>
    </Layout.Sider>
  );
}
