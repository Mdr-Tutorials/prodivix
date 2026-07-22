import './PdxTable.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxNativeProps,
} from '../foundation/component';
import {
  forwardRef,
  useId,
  type ForwardedRef,
  type Key,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { renderUnknownCellValue } from './renderUnknownCellValue';

export interface PdxTableColumn<T = Record<string, unknown>> {
  align?: 'Left' | 'Center' | 'Right';
  dataIndex?: keyof T | string;
  key: string;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  title: ReactNode;
  width?: string | number;
}

export interface PdxTableOwnProps<T = Record<string, unknown>> {
  bordered?: boolean;
  caption?: ReactNode;
  columns: Array<PdxTableColumn<T>>;
  data: T[];
  emptyState?: ReactNode;
  emptyText?: ReactNode;
  hoverable?: boolean;
  loading?: boolean;
  loadingRows?: number;
  rowKey?: keyof T | ((record: T, index: number) => Key);
  size?: 'Small' | 'Medium' | 'Large';
  stickyHeader?: boolean;
  striped?: boolean;
  title?: ReactNode;
}

export type PdxTableProps<T = Record<string, unknown>> = Omit<
  PdxNativeProps<'div'>,
  'children' | 'title'
> &
  PdxTableOwnProps<T>;

function PdxTableInner<T extends Record<string, unknown>>(
  {
    'aria-label': ariaLabel,
    bordered = false,
    caption,
    className,
    columns,
    data,
    dataAttributes,
    emptyState,
    emptyText = 'No data',
    hoverable = false,
    loading = false,
    loadingRows = 3,
    rowKey,
    size = 'Medium',
    stickyHeader = false,
    striped = false,
    title,
    ...rest
  }: PdxTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const titleId = useId();
  const resolveRowKey = (record: T, index: number): Key => {
    if (typeof rowKey === 'function') return rowKey(record, index);
    if (rowKey !== undefined) {
      const value = record[rowKey];
      if (typeof value === 'string' || typeof value === 'number') return value;
    }
    return index;
  };

  return (
    <div
      {...rest}
      {...getDataAttributes(dataAttributes)}
      aria-label={title ? undefined : (ariaLabel ?? 'Data table')}
      aria-labelledby={title ? titleId : undefined}
      className={mergeClassNames('PdxTableRegion', className)}
      ref={ref}
      role="region"
    >
      {title ? (
        <div className="PdxTableTitle" id={titleId}>
          {title}
        </div>
      ) : null}
      <div className="PdxTableScroll" tabIndex={0}>
        <table
          aria-busy={loading || undefined}
          className={mergeClassNames(
            'PdxTable',
            size,
            bordered && 'Bordered',
            striped && 'Striped',
            hoverable && 'Hoverable',
            stickyHeader && 'StickyHeader'
          )}
        >
          {caption ? <caption>{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className={`Align${column.align ?? 'Left'}`}
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from(
                  { length: Math.max(1, loadingRows) },
                  (_, rowIndex) => (
                    <tr key={`loading-${rowIndex}`}>
                      {columns.map((column) => (
                        <td key={column.key}>
                          <span className="PdxTableSkeleton" />
                        </td>
                      ))}
                    </tr>
                  )
                )
              : null}
            {!loading && data.length === 0 ? (
              <tr>
                <td
                  className="PdxTableEmpty"
                  colSpan={Math.max(1, columns.length)}
                >
                  {emptyState ?? emptyText}
                </td>
              </tr>
            ) : null}
            {!loading
              ? data.map((record, index) => (
                  <tr key={resolveRowKey(record, index)}>
                    {columns.map((column) => {
                      const value = column.dataIndex
                        ? record[column.dataIndex as keyof T]
                        : undefined;
                      return (
                        <td
                          className={`Align${column.align ?? 'Left'}`}
                          key={column.key}
                        >
                          {column.render
                            ? column.render(value, record, index)
                            : renderUnknownCellValue(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PdxTable = forwardRef(PdxTableInner) as <
  T extends Record<string, unknown>,
>(
  props: PdxTableProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null;

export default PdxTable;
