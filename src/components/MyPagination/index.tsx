import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useUpdateEffect } from 'ahooks';
import { Pagination, type PaginationProps } from 'antd';
import classNames from 'classnames';
import styles from './style.module.less';
export default (props: Props) => {
  const { className, pageSize = 10, current, onChange, total, ...other } = props;

  useUpdateEffect(() => {
    if (!current) return;
    if (current == 1) return;
    if (current > Math.ceil(total / pageSize)) {
      onChange(1, pageSize); // 当前页大于最大页时，重置到第一页
    }
  }, [total]);

  return (
    <Pagination
      showQuickJumper
      showSizeChanger
      pageSize={pageSize}
      current={current}
      total={total}
      onChange={onChange}
      showTotal={(total) => `共 ${total} 条记录`}
      {...other}
      className={classNames(styles.pagination, className)}
      itemRender={(_, type, originalElement) => {
        if (type === 'prev') {
          return <LeftOutlined />;
        }
        if (type === 'next') {
          return <RightOutlined />;
        }
        return originalElement;
      }}
    />
  );
};

interface Props extends PaginationProps {
  className?: string;
  pageSize?: number;
  current?: number;
  onChange: (page: number, pageSize: number) => void;
  total: number;
  [key: string]: any;
}
