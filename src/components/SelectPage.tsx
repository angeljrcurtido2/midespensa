import { FaFilter } from "react-icons/fa";

const SelectPage = ({ limit, setLimit, setPage }: { limit: number; setLimit: (limit: number) => void; setPage: (page: number) => void }) => {
    return <div className="flex items-center gap-2">
        <FaFilter className="text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">Mostrar:</span>
        <select
            value={limit}
            onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
            }}
            className="px-3 py-1.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
        </select>
    </div>;
}

export default SelectPage;