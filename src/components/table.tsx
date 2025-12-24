import { flexRender, RowData, Table as TB } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

interface Props<TData extends RowData> {
  variant?: "default" | "primary";
  table: TB<TData>;
  last?: number;
  showFooter?: boolean;
}

const PROHIBIT_COLUMNS = ["action", "comment"];

export const headerVariants = cva(
  "sticky top-9 z-20 start-0 h-8 border-r-[1.25px] border-border",
  {
  variants: {
    variant: {
      default: "bg-sidebar shadow-[inset_0_1.25px_0_rgba(42,28,0,0.07),inset_0_-1.25px_0_rgba(42,28,0,0.07)] dark:shadow-[inset_0_1.25px_0_rgba(255,255,243,0.082),inset_0_-1.25px_0_rgba(255,255,243,0.082)]",
      primary: "bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const Table = <TData extends RowData>({ table, last = 2, variant = "default", showFooter = false }: Props<TData>) => {
  return (
    <table className="mt-0 table-fixed border-collapse min-w-full">
      <thead className={cn(variant === "primary" && "border-[#CAD1DD] dark:border-[#3d587C] border-y")}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header, index, headers) => {
              const width = header.column.columnDef.meta?.width;
              const columnMatched = PROHIBIT_COLUMNS.includes(header.id);

              const isBeforeLast = index === headers.length - last ;

              return (
                columnMatched ? (
                  <th
                    key={header.id}
                    className="sticky start-8 top-10 z-87 p-0"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                    )}
                  </th>
                ) : (
                  <th 
                    key={header.id}
                    style={{ width }}
                    className={cn(headerVariants({ variant }), "px-3",
                      isBeforeLast && "border-none",
                    )}
                  >
                    <div className="flex items-center h-full">
                      <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                        )}
                      </div>
                    </div>
                  </th>
                )
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows?.length ? (
          <>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-selected={row.getIsSelected()}
                className="relative h-px rounded-none! border-b border-border group bg-background odd:bg-sidebar
                data-[selected=true]:inset-x-0 data-[selected=true]:top-[0.5px] data-[selected=true]:bottom-[0.5px] data-[selected=true]:bg-[#2383e224] data-[selected=true]:bg-size-[auto_100px] data-[selected=true]:rounded"
              >
                {row.getVisibleCells().map((cell, index, cells) => {
                  const width = cell.column.columnDef.meta?.width;
                  const isSticky = cell.column.columnDef.meta?.sticky;
                  const columnMatched = PROHIBIT_COLUMNS.includes(cell.id.split("_")[1]);
  
                  const isBeforeLast = index === cells.length - last;
  
                  return (
                    columnMatched ? (
                      <td key={cell.id} className="sticky stroke-9 z-85 flex p-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ) : (
                      <td 
                        key={index} 
                        className={cn(
                          "align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border",
                          isBeforeLast && "border-none dark:border-none",
                          isSticky && "sticky start-0",
                          width,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    )
                  );
                })}
              </tr>
            ))}
          </>
        ) : (
          <tr>
            <td
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              No results.
            </td>
          </tr>
        )}
      </tbody>
      {showFooter && (
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id} className={cn(variant === "primary" && "border-[#CAD1DD] dark:border-[#3d587C] border-y")}>
              {footerGroup.headers.map((header, index) => {
                const width = header.column.columnDef.meta?.width;
                const isBeforeLast = index === footerGroup.headers.length - last ;

                return (
                  <th key={header.id} className={cn(headerVariants({ variant }), "px-2", isBeforeLast && "border-none", width )}>
                    <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </tfoot>
      )}
    </table>
  );
}