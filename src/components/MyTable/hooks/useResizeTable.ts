import type { TableProps } from 'antd';

export const useResizeTable = (columns: TableProps<any>['columns'], resizeAble: boolean) => {
  const [resizedColumns, setResizedColumns] = useState(() =>
    columns!.map((col) => (resizeAble ? { ...col, width: col.width || 150 } : col)),
  );

  useEffect(() => {
    setResizedColumns(
      columns!.map((col) => (resizeAble ? { ...col, width: col.width || 150 } : col)),
    );
  }, [columns, resizeAble]);

  const handleResize =
    (index: number) =>
    (_, { size }: { size: { width: number; height: number } }) => {
      const newColumns = [...resizedColumns];
      newColumns[index] = {
        ...newColumns[index],
        width: size.width,
      };
      setResizedColumns(newColumns);
    };

  const renderColumns = resizeAble
    ? resizedColumns.map((col, index) => ({
        ...col,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(index),
        }),
      }))
    : columns;

  return renderColumns;
};
