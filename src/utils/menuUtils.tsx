import { Spin } from 'antd';
import { Suspense } from 'react';
import { matchRoutes } from 'react-router';

// 格式化菜单
export const formatter = (data: IMenu[], parentPath = ''): IFormatMenu[] => {
  return data.map((item) => {
    let { path, children, ...other } = item;
    // 拼出绝对路径 做一个容错处理 将///// 替换成 /
    path = (parentPath + '/' + item.path).replace(/\/{2,}/g, '/');

    const result = {
      ...other,
      key: path.replace(/\/:[^\/]+/g, ''), // 匹配出 /:id 这种格式
      path,
      children,
      parentPath,
      parentKey: parentPath.replace(/\/:[^\/]+/g, ''), // 匹配出 /:id 这种格式
    };

    if (children?.length) {
      result.children = formatter(children, path);
    }
    return result;
  });
};

// 扁平化
export const flatten = <T extends { children?: T[]; [key: string]: any }>(arr: T[] = []): T[] => {
  return arr.reduce((pre, cur) => {
    return cur.children ? pre.concat(cur, flatten(cur.children)) : pre.concat(cur);
  }, [] as T[]);
};

/** 将组件变成懒加载 用法同React.lazy */
export function l(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  const Component = lazy(factory);
  return () => (
    <Suspense
      fallback={
        <Spin
          size='large'
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        />
      }>
      <Component />
    </Suspense>
  );
}