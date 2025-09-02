import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';


interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface PaginationProps {
  pagination: PaginationData;
  itemsPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>> | ((page: any) => void);
}

const Pagination = ({ pagination, itemsPerPage, setCurrentPage }: PaginationProps) => {
  return (
    <div>
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">
                {(pagination.currentPage - 1) * itemsPerPage + 1}
              </span> to <span className="font-medium">
                {Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems)}
              </span> of <span className="font-medium">{pagination.totalItems}</span> results
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.currentPage === pageNum
                    ? 'z-10 bg-[#129990] border-[#129990] text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, pagination.totalPages))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination;
