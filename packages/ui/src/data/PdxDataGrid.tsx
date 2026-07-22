import './PdxDataGrid.scss';
import { type PdxComponent } from '@prodivix/shared';
import { getDataAttributes } from '../foundation/component';
import type React from 'react';
import { renderUnknownCellValue } from './renderUnknownCellValue';

export interface PdxDataGridColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  dataIndex?: keyof T | string;
  width?: string | number;
  align?: 'Left' | 'Center' | 'Right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

interface PdxDataGridSpecificProps<T = Record<string, unknown>> {
  data: T[];
  columns: Array<PdxDataGridColumn<T>>;
  showHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  rowKey?: keyof T | ((record: T) => string);
  emptyText?: string;
}

export interface PdxDataGridProps<T = Record<string, unknown>>
  extends PdxComponent, PdxDataGridSpecificProps<T> {}

function PdxDataGrid<T extends Record<string, unknown>>({
  data,
  columns,
  showHeader = true,
  striped = false,
  bordered = false,
  hoverable = false,
  rowKey,
  emptyText = 'No data',
  className,
  style,
  id,
  dataAttributes = {},
}: PdxDataGridProps<T>) {
  const columnTemplate = columns
    .map((column) =>
      typeof column.width === 'number'
        ? `${column.width}px`
        : column.width || '1fr'
    )
    .join(' ');

  const fullClassName =
    `PdxDataGrid ${striped ? 'Striped' : ''} ${bordered ? 'Bordered' : ''} ${hoverable ? 'Hoverable' : ''} ${className || ''}`.trim();
  const dataProps = getDataAttributes(dataAttributes);

  const getRowKey = (record: T, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    if (typeof rowKey === 'string') {
      return String((record as Record<string, unknown>)[rowKey as string]);
    }
    return String(index);
  };

  return (
    <div
      aria-colcount={columns.length}
      aria-rowcount={
        data.length + (showHeader ? 1 : 0) + (data.length === 0 ? 1 : 0)
      }
      className={fullClassName}
      {...dataProps}
      id={id}
      role="grid"
      style={style as React.CSSProperties}
    >
      {showHeader && (
        <div
          aria-rowindex={1}
          className="PdxDataGridHeader"
          role="row"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          {columns.map((column, columnIndex) => (
            <div
              aria-colindex={columnIndex + 1}
              key={column.key}
              className={`PdxDataGridCell Align${column.align || 'Left'}`}
              role="columnheader"
            >
              {column.title}
            </div>
          ))}
        </div>
      )}
      {data.length === 0 && (
        <div
          aria-rowindex={showHeader ? 2 : 1}
          className="PdxDataGridEmpty"
          role="row"
        >
          <div aria-colspan={columns.length} role="gridcell">
            {emptyText}
          </div>
        </div>
      )}
      {data.map((record, index) => (
        <div
          aria-rowindex={index + (showHeader ? 2 : 1)}
          key={getRowKey(record, index)}
          className="PdxDataGridRow"
          role="row"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          {columns.map((column, columnIndex) => {
            const value = column.dataIndex
              ? (record as Record<string, unknown>)[column.dataIndex as string]
              : undefined;
            return (
              <div
                aria-colindex={columnIndex + 1}
                key={column.key}
                className={`PdxDataGridCell Align${column.align || 'Left'}`}
                role="gridcell"
              >
                {column.render
                  ? column.render(value, record, index)
                  : renderUnknownCellValue(value)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default PdxDataGrid;
