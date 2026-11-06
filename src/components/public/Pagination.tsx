import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#e5e2d9] pt-8 mt-12 gap-4">
      {/* Items count indicator */}
      <div className="text-xs text-stone-500 font-sans tracking-wide">
        Mostrando <span className="font-semibold text-stone-900">{startItem}</span> - <span className="font-semibold text-stone-900">{endItem}</span> de <span className="font-semibold text-stone-900">{totalItems}</span> publicaciones
      </div>

      {/* Pagination controls */}
      <nav className="flex items-center space-x-1.5" aria-label="Paginación de artículos">
        {/* First page */}
        <button
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          className="p-2 rounded border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-gold-500 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Primera página"
          aria-label="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded border border-stone-200 text-xs font-medium text-stone-700 hover:text-stone-900 hover:border-gold-500 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center space-x-1"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((item, index) => {
            if (item === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-stone-400 select-none">
                  •••
                </span>
              );
            }

            const pageNum = Number(item);
            const isCurrent = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => handlePageClick(pageNum)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-8 h-8 flex items-center justify-center rounded text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#121212] text-white shadow-sm ring-1 ring-gold-500'
                    : 'border border-stone-200 text-stone-700 hover:border-gold-500 hover:bg-stone-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded border border-stone-200 text-xs font-medium text-stone-700 hover:text-stone-900 hover:border-gold-500 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center space-x-1"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-gold-500 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Última página"
          aria-label="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
