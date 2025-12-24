import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData = unknown> {
    width?: string;
    sticky?: boolean;
    colSpan?: number;
  }

  interface TableMeta<TData extends RowData> {
    rowHeights?: Record<string, { input: number; output: number }>;
    columnWidth?: number;
    formValues?: unknown;
    [key: string]: unknown;
  }

  interface ColumnSort {
    desc: boolean;
    id: string;
    icon?: LucideIcon;
  }

  interface CellContext<TData extends RowData, TValue = unknown> {
    getValue: () => TValue;
    renderValue: () => TValue | null;
    row: Row<TData>;
    column: Column<TData, TValue>;
    table: Table<TData>;
  }
}
