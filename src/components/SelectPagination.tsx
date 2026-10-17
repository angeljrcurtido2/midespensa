import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface SelectPaginationProps {
  setPage: (page: number) => void;
  page: number;
  totalPages: number;
}

const SelectPagination = ({ setPage, page, totalPages }: SelectPaginationProps) => {
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 font-semibold disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Página <span className="font-bold text-blue-600 dark:text-blue-400">{page}</span> de <span className="font-bold text-blue-600 dark:text-blue-400">{totalPages}</span>
          </span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={page >= totalPages}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 font-semibold disabled:cursor-not-allowed w-full sm:w-auto"
        >
          Siguiente
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SelectPagination;