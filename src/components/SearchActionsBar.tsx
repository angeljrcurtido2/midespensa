import { FaSearch } from 'react-icons/fa';
import type { ReactNode } from 'react';
import { styleSearchDark } from './utils/stylesGral';

interface SearchActionsBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    children?: ReactNode; // Para los botones/acciones principales
    extraContent?: ReactNode; // Para contenido adicional (filtros de fecha, botones de reportes, etc.)
}

export default function SearchActionsBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    children,
    extraContent
}: SearchActionsBarProps) {
    return (
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="relative w-full md:w-96">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={styleSearchDark}
                    />
                </div>

                {children && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {children}
                    </div>
                )}
            </div>

            {extraContent && (
                <div className="mt-4">
                    {extraContent}
                </div>
            )}
        </div>
    );
}
