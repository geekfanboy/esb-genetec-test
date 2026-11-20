import React from 'react';
import { cn } from '../utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginatorProps extends React.HTMLAttributes<HTMLElement> {
  pages: number;
  currentPage: number;
  disabled?: boolean;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const PAGE_SIZES = [10, 50, 100, 500, 1000, 5000, 10000];

/* parses and validates the page input. returns page number if valid, otherwise undefined */
const parsePageInput = (value: string, pages: number): number | undefined => {
  if (!/^\d+$/.test(value)) return undefined;

  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= pages
    ? page
    : undefined;
};

export const Paginator = ({
  className,
  pages,
  currentPage,
  disabled,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginatorProps) => {
  const [pageInput, setPageInput] = React.useState(String(currentPage));

  React.useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  React.useEffect(() => {
    const page = parsePageInput(pageInput, pages);

    /* ensure valid page number */
    if (disabled || page === undefined || page === currentPage) return;

    /* debounce page change */
    const timer = setTimeout(() => {
      onPageChange?.(page);
    }, 500);
    return () => clearTimeout(timer);
  }, [pageInput, currentPage, pages, disabled, onPageChange]);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between px-2', className)}
    >
      <div className="flex items-center space-x-1">
        <button
          disabled={currentPage === 1 || disabled}
          className={cn(
            'px-4 py-2 rounded-md font-medium enabled:hover:bg-gray-200 enabled:cursor-pointer disabled:opacity-25',
          )}
          onClick={() => onPageChange?.(1)}
          aria-label="First page"
        >
          <ChevronsLeft aria-hidden="true" />
        </button>
        <button
          disabled={currentPage === 1 || disabled}
          className={cn(
            'px-4 py-2 rounded-md font-medium enabled:hover:bg-gray-200 enabled:cursor-pointer disabled:opacity-25',
          )}
          onClick={() => onPageChange?.(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <label>
          Page{' '}
          <input
            type="text"
            value={pageInput}
            size={String(pages).length}
            className="w-fit min-w-0 px-1 py-0 mx-2 border-b-2 border-slate-300 hover:bg-slate-100 text-center font-bold text-slate-500"
            disabled={disabled}
            onChange={(event) => {
              const value = event.currentTarget.value;

              if (value === '' || parsePageInput(value, pages) !== undefined) {
                setPageInput(value);
              }
            }}
          />{' '}
          of <span className="ml-2 font-bold text-slate-500">{pages}</span>
        </label>
        <button
          disabled={currentPage === pages || disabled}
          className={cn(
            'px-4 py-2 rounded-md font-medium enabled:hover:bg-gray-200 enabled:cursor-pointer disabled:opacity-25',
          )}
          onClick={() => onPageChange?.(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight aria-hidden="true" />
        </button>
        <button
          disabled={currentPage === pages || disabled}
          className={cn(
            'px-4 py-2 rounded-md font-medium enabled:hover:bg-gray-200 enabled:cursor-pointer disabled:opacity-25',
          )}
          onClick={() => onPageChange?.(pages)}
          aria-label="Last page"
        >
          <ChevronsRight aria-hidden="true" />
        </button>
      </div>
      <label>
        Items per page:
        <select
          value={itemsPerPage}
          disabled={disabled}
          className="ml-2 px-1 py-1 border-slate-300 rounded-xs hover:bg-slate-100 text-center border-b-2 font-bold text-slate-500"
          onChange={(event) =>
            onItemsPerPageChange?.(Number(event.target.value))
          }
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
};
