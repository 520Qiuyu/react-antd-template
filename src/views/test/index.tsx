import { useMatches } from 'react-router';
import { NavLink, useMatch } from 'react-router';

console.log('Test 加载');

// await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟延迟加载

export default function Test() {
  return (
    <div>
      测试
      <NavLink to='testDetail/999'>去详情页</NavLink>
      <br />
      <NavLink to='testDetail2/999'>去一个不存在的地址</NavLink>
    </div>
  );
}
