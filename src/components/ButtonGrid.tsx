import { FaList, FaTh } from "react-icons/fa";

const ButtonGrid = ({ onClick, vistaGrid }: { onClick: (vistaGrid: boolean) => void, vistaGrid: boolean }) => {
    return (
         <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                    <button
                                        onClick={() => onClick(true)}
                                        className={`p-2.5 rounded-lg transition-all ${
                                            vistaGrid
                                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                        title="Vista Grid"
                                    >
                                        <FaTh size={18} />
                                    </button>
                                    <button
                                        onClick={() => onClick(false)}
                                        className={`p-2.5 rounded-lg transition-all ${
                                            !vistaGrid
                                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                        title="Vista Lista"
                                    >
                                        <FaList size={18} />
                                    </button>
                                </div>
    );
};

export default ButtonGrid;