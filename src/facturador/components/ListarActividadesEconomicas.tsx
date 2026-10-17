'use client';

import { useEffect, useState } from 'react';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaInfoCircle, FaBriefcase, FaCheck } from 'react-icons/fa';
import ModalsCrearActividadesEconomicas from './ModalsActivEcon/ModalsCrearActividadesEconomicas';
import ModalsEditarActividadesEconomicas from './ModalsActivEcon/ModalsEditarActividadesEconomicas';
import {fetchActividadesEconomicas,deleteActividadEconomica} from '../../services/facturador';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';
import ButtonGrid from '../../components/ButtonGrid';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';

interface ListarActividadesEconomicasProps {
  onSelect?: (selectedActivities: any[]) => void;
}

const styleCardSmall = "bg-blue-50 dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-gray-600";
const styleTxtCards = "text-xs text-blue-600 dark:text-blue-300 font-medium mb-1";
const styleTxtLabelBold = "text-xs font-bold text-blue-700 dark:text-gray-100 truncate";

const ListarActividadesEconomicas = ({ onSelect }: ListarActividadesEconomicasProps) => {
    const [actividades, setActividades] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [modalCrearActividadOpen, setModalCrearActividadOpen] = useState(false);
    const [modalEditarActividadOpen, setModalEditarActividadOpen] = useState(false);
    const [idActividadEditar, setIdActividadEditar] = useState<number | string>("");
    const [vistaGrid, setVistaGrid] = useState(true);
    const [loading, setLoading] = useState(false);

    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [advertMessage, setAdvertMessage] = useState("");
    const [actividadAEliminar, setActividadAEliminar] = useState<number | null>(null);

    const [selectedActivities, setSelectedActivities] = useState<any[]>([]);

    const fetchActividades = async () => {
        setLoading(true);
        try {
           const res = await fetchActividadesEconomicas(page, limit, search);
            setActividades(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error al obtener actividades económicas:', error);
            setErrorMessage('Error al obtener las actividades económicas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setActividadAEliminar(id);
        setAdvertMessage('¿Estás seguro de que deseas eliminar esta actividad económica?');
        setModalAdvertOpen(true);
    };

    const confirmarEliminacion = async () => {
        if (actividadAEliminar === null) return;

        try {
            await deleteActividadEconomica(actividadAEliminar);
            setSuccessMessage('  Actividad económica eliminada exitosamente');
            fetchActividades();
        } catch (error) {
            console.error('Error al eliminar actividad:', error);
            setErrorMessage('  No se pudo eliminar la actividad económica');
        } finally {
            setModalAdvertOpen(false);
            setActividadAEliminar(null);
        }
    };

    const handleEdit = (id: number) => {
        setIdActividadEditar(id);
        setModalEditarActividadOpen(true);
    };

    useEffect(() => {
        fetchActividades();
    }, [page, limit, search]);

    useEffect(() => {
        if (onSelect) {
            onSelect(selectedActivities);
        }
    }, [selectedActivities, onSelect]);

    const toggleSelect = (actividad: any) => {
        if (selectedActivities.some(a => a.idactividad === actividad.idactividad)) {
            setSelectedActivities(prev => prev.filter(a => a.idactividad !== actividad.idactividad));
        } else {
            setSelectedActivities(prev => [...prev, actividad]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6 text-white">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl">
                            <FaBriefcase className="text-white text-3xl sm:text-4xl" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                                Actividades Económicas
                            </h1>
                            <p className="text-sm sm:text-base text-blue-100">
                                Administra las actividades económicas del sistema
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Actions Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por descripción..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setModalCrearActividadOpen(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                            >
                                <FaPlus />
                                Nueva Actividad
                            </button>
                            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                            <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && actividades.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <FaInfoCircle className="text-gray-400 dark:text-gray-500 text-5xl mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            {search
                                ? 'No se encontraron actividades económicas con ese criterio de búsqueda'
                                : 'No hay actividades económicas registradas'}
                        </p>
                    </div>
                )}

                {/* Vista condicional: Grid o Lista */}
                {!loading && actividades.length > 0 && (
                    <div className={vistaGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid grid-cols-1 gap-4"}>
                        {actividades.map((actividad, idx) => (
                            <div
                                key={actividad.idactividad}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500"
                            >
                                {/* Header con gradiente */}
                                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 text-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                                                <FaBriefcase className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <h3 className="font-bold text-base truncate">Actividad #{(page - 1) * limit + idx + 1}</h3>
                                                <p className="text-xs opacity-90 truncate">ID: {actividad.idactividad}</p>
                                            </div>
                                        </div>
                                        {onSelect && (
                                            <input
                                                type="checkbox"
                                                checked={selectedActivities.some(a => a.idactividad === actividad.idactividad)}
                                                onChange={() => toggleSelect(actividad)}
                                                className="w-5 h-5 rounded border-2 border-white/50 bg-white/20 checked:bg-white checked:border-white cursor-pointer flex-shrink-0"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-3">
                                    {/* Datos con CardText */}
                                    <div className="grid grid-cols-1 gap-2">
                                        <CardText
                                            title="Descripción"
                                            text={actividad.descripcion}
                                            containerClass={styleCardSmall}
                                            titleClass={styleTxtCards}
                                            textClass={styleTxtLabelBold}
                                        />
                                    </div>

                                    {/* Acciones */}
                                    <div className="pt-3 border-t border-blue-100 dark:border-gray-600 flex gap-2">
                                        {onSelect ? (
                                            <button
                                                onClick={() => toggleSelect(actividad)}
                                                className={`flex-1 flex items-center justify-center gap-2 ${
                                                    selectedActivities.some(a => a.idactividad === actividad.idactividad)
                                                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                                } text-white py-2 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg`}
                                            >
                                                <FaCheck />
                                                {selectedActivities.some(a => a.idactividad === actividad.idactividad) ? 'Seleccionado' : 'Seleccionar'}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(actividad.idactividad)}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                                                    title="Editar"
                                                >
                                                    <FaEdit />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(actividad.idactividad)}
                                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                                                    title="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginación */}
                {!loading && actividades.length > 0 && (
                    <div className="mt-6">
                        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
                    </div>
                )}
            </div>

            {/* Modales */}
            <ModalsCrearActividadesEconomicas
                isOpen={modalCrearActividadOpen}
                onClose={() => setModalCrearActividadOpen(false)}
                onSuccess={() => {
                    fetchActividades();
                    setSuccessMessage('  Actividad económica creada exitosamente');
                }}
            />
            <ModalsEditarActividadesEconomicas
                isOpen={modalEditarActividadOpen}
                onClose={() => setModalEditarActividadOpen(false)}
                id={idActividadEditar}
                onSuccess={() => {
                    fetchActividades();
                    setSuccessMessage('  Actividad económica actualizada exitosamente');
                }}
            />

            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                onConfirm={confirmarEliminacion}
                message={advertMessage}
                confirmButtonText="Sí, Eliminar"
            />

            <ModalSuccess
                isOpen={!!successMessage}
                onClose={() => setSuccessMessage("")}
                message={successMessage}
            />

            <ModalError
                isOpen={!!errorMessage}
                onClose={() => setErrorMessage("")}
                message={errorMessage}
            />
        </div>
    );
};

export default ListarActividadesEconomicas;
