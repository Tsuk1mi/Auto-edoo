import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Table container styles
const tableVariants = cva(
  'w-full text-left',
  {
    variants: {
      variant: {
        default: 'border-collapse',
        separated: 'border-separate border-spacing-0',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      bordered: {
        true: 'border border-gray-200 dark:border-gray-700',
        false: '',
      },
      striped: {
        true: '',
        false: '',
      },
      hoverable: {
        true: '',
        false: '',
      },
      sticky: {
        true: 'relative',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      bordered: false,
      striped: false,
      hoverable: false,
      sticky: false,
    },
  }
);

// Table component
export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  loading?: boolean;
  emptyState?: React.ReactNode;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({
    children,
    className,
    variant,
    size,
    bordered,
    striped,
    hoverable,
    sticky,
    loading = false,
    emptyState,
    ...props
  }, ref) => {
    return (
      <div className={`${bordered ? `border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden` : ''} w-full`}>
        <div className="overflow-x-auto">
          <table
            ref={ref}
            className={tableVariants({ variant, size, bordered, striped, hoverable, sticky, className })}
            {...props}
          >
            {children}
            {loading && (
              <tbody>
                <tr>
                  <td colSpan={100} className="text-center py-6">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Загрузка данных...</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
            {emptyState && !loading && React.Children.count(children) <= 1 && (
              <tbody>
                <tr>
                  <td colSpan={100} className="text-center py-8">
                    {emptyState}
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>
    );
  }
);

Table.displayName = 'Table';

// Table header component
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = '', sticky = false, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={`
          bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300
          ${sticky ? 'sticky top-0 z-10' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = 'TableHeader';

// Table body component
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = 'TableBody';

// Table footer component
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className = '', sticky = false, children, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={`
          bg-gray-50 dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-300
          ${sticky ? 'sticky bottom-0 z-10' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </tfoot>
    );
  }
);

TableFooter.displayName = 'TableFooter';

// Table row component
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = '', selected = false, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={`
          border-b border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
          ${selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

// Table cell component
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  truncate?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', truncate = false, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={`
          px-4 py-3
          ${truncate ? 'max-w-[12rem] truncate' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';

// Table head cell component
export interface TableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
}

export const TableHeadCell = React.forwardRef<HTMLTableCellElement, TableHeadCellProps>(
  ({
    className = '',
    sortable = false,
    sortDirection = null,
    children,
    onClick,
    ...props
  }, ref) => {
    return (
      <th
        ref={ref}
        className={`
          px-4 py-3 font-semibold text-left
          ${sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
          ${className}
        `}
        onClick={sortable ? onClick : undefined}
        {...props}
      >
        <div className="flex items-center">
          {children}
          {sortable && (
            <span className="inline-block ml-1">
              {sortDirection === 'asc' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              )}
              {sortDirection === 'desc' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {sortDirection === null && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-40" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);

TableHeadCell.displayName = 'TableHeadCell';
