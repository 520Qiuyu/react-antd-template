import { Table, type TableProps } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import MyPagination from '../MyPagination';
import TextOverflowShowTips from '../TextOverflowShowTips';
import ResizableTitle from './components/ResizableTitle';
import { useResizeTable } from './hooks/useResizeTable';
import styles from './index.module.less';

const MyTable = <T extends Object = any>(props: Props<T>) => {
  const { pagination, resizeAble = true, columns = [], ...restProps } = props;

  const tableRef = useRef<HTMLDivElement>(null);

  const resizeColumns = useResizeTable(columns, resizeAble);
  const renderColumns = (resizeAble ? resizeColumns : columns)?.map((col) => {
    return {
      ...col,
      ellipsis: col.ellipsis ? { showTitle: false } : false,
      render:
        col.render ||
        (col.ellipsis
          ? (text: any) => (
              <TextOverflowShowTips
                text={text}
                /* tooltipProps={{
                  getPopupContainer: (node) => {
                    console.log('node', node);
                    console.log(
                      'tableRef.current?.querySelector(.ant-table-container)',
                      tableRef.current,
                      tableRef.current?.querySelector('.ant-table-container'),
                    );
                    return tableRef.current?.querySelector('.ant-table-container') || document.body;
                  },
                }} */
              />
            )
          : col.render),
    };
  });

  const components = resizeAble
    ? {
        header: {
          cell: ResizableTitle,
        },
      }
    : undefined;

  return (
    <>
      <Table
        ref={tableRef as any}
        className={styles['my-table']}
        size='middle'
        rowClassName={(_, index) => (index % 2 === 1 ? 'rowCla' : '')}
        {...restProps}
        columns={renderColumns}
        pagination={false}
        components={components}
      />
      {pagination && <MyPagination style={{ marginTop: 16 }} {...pagination} />}
    </>
  );
};

export default MyTable;

interface Props<T> extends Omit<TableProps<T>, 'columns'> {
  pagination?: Parameters<typeof MyPagination>[0] | false;
  resizeAble?: boolean;
  columns?: customColumnProps<T>[];
}

export type customColumnProps<T> = ColumnProps<T> & {
  resizeAble?: boolean;
  width?: number | string;
};
