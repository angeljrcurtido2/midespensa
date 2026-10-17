'use client';

import { useEffect, useState } from 'react';
import { FaSearch, FaPlus, FaTrash, FaInfoCircle, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';
import ModalAdvert from '../../../components/ModalAdvert';
import ModalError from '../../../components/ModalError';
import ModalSuccess from '../../../components/ModalSuccess';
import ModalCrearTiposEgreso from '../ModalMovimiento/Egreso/ModalCrearTiposEgreso';
import { getTiposEgresoPaginated, anularTipoEgreso } from '../../../services/egreso';
import CardText from '../../../ventas/components/CobroDeudaVenta/components/CardText';
import SelectPage from '../../../components/SelectPage';
import ButtonGrid from '../../../components/ButtonGrid';
import SelectPagination from '../../../components/SelectPagination';
import { renderTitle } from '../../../clientes/utils/utils';

interface TipoEgreso {
  idtipo_egreso: number;
  descripcion: string;
  created_at: string;
}

interface ListarTiposEgresoProps {
  onSelect?: (tipo: TipoEgreso) => void;
}

const ListarTiposEgresoList = ({ onSelect }: ListarTiposEgresoProps) => {
  const [egresos, setEgresos] = useState<TipoEgreso[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showAdvert, setShowAdvert] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [idEgresoAAnular, setIdEgresoAAnular] = useState<number | null>(null);


  const fetchEgresos = async () => {
    setLoading(true);
    try {
      const res = await getTiposEgresoPaginated({ page, limit, search });
      setEgresos(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Error al obtener tipos de egresos:', error);
      setErrorMessage('Error al obtener los tipos de egresos.');
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = (id: number) => {
    setIdEgresoAAnular(id);
    setShowAdvert(true);
  };

  const confirmarAnulacion = async () => {
    if (idEgresoAAnular === null) return;

    try {
      await anularTipoEgreso(idEgresoAAnular);
      setSuccessModalOpen(true);
      fetchEgresos();
    } catch (error) {
      console.error('Error al anular tipo de egreso:', error);
      setErrorMessage('  No se pudo anular el tipo de egreso.');
      setErrorModalOpen(true);
    } finally {
      setShowAdvert(false);
      setIdEgresoAAnular(null);
    }
  };

  useEffect(() => {
    fetchEgresos();
  }, [page, limit, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY');
  };

 return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {renderTitle ({title:"Tipos de Egresos", subtitle:"Administra los tipos de egresos", icon:<FaMoneyBillWave className="text-white text-3xl sm:text-4xl" />})}
        {/* Search and Actions Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por descripción..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
              >
                <FaPlus />
                Nuevo Tipo
              </button>
              <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
              <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && egresos.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <FaInfoCircle className="text-gray-400 dark:text-gray-500 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {search
                ? 'No se encontraron tipos de egresos con ese criterio de búsqueda'
                : 'No hay tipos de egresos registrados'}
            </p>
          </div>
        )}

        {/* Vista condicional: Grid o Lista */}
        {!loading && egresos.length > 0 && (
          <div className={vistaGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid grid-cols-1 gap-4"}>
            {egresos.map((egreso, idx) => (
              <div
                key={egreso.idtipo_egreso}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-blue-100 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
              >
                {/* Header con gradiente */}
                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 text-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                      <div className="bg-white/20 dark:bg-gray-600/30 p-2 rounded-lg flex-shrink-0">
                        <FaMoneyBillWave className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-bold text-base truncate">{egreso.descripcion}</h3>
                        <p className="text-xs opacity-90 dark:text-gray-300 truncate">#{(page - 1) * limit + idx + 1}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Datos con CardText */}
                  <div className="grid grid-cols-1 gap-2">
                    <CardText
                      title="Descripción"
                      text={egreso.descripcion}
                    />
                    <CardText
                      title="Fecha de Creación"
                      text={formatDate(egreso.created_at)}
                    />
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 border-t border-blue-100 dark:border-gray-600 flex gap-2">
                    {onSelect && (
                      <button
                        onClick={() => onSelect(egreso)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white py-2 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        <FaCheckCircle />
                        Seleccionar
                      </button>
                    )}
                    <button
                      onClick={() => handleAnular(egreso.idtipo_egreso)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white py-2 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                    >
                      <FaTrash />
                      Anular
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && egresos.length > 0 && (
          <div className="mt-6">
            <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalCrearTiposEgreso
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={fetchEgresos}
      />

      <ModalAdvert
        isOpen={showAdvert}
        onClose={() => setShowAdvert(false)}
        onConfirm={confirmarAnulacion}
        message="¿Estás seguro de que deseas anular este tipo de egreso?"
        confirmButtonText="Sí, Anular"
      />

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Anulación procesada con éxito"
      />

      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default ListarTiposEgresoList;