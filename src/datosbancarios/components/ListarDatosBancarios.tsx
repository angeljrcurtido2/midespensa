'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import {
  FaUniversity,
  FaCreditCard,
  FaUser,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaSearch,
  FaInfoCircle,
  FaPlus
} from 'react-icons/fa';
import {
  getDatosBancariosPaginated,
  deleteDatosBancarios
} from '../../services/datosBancarios';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import ModalAdvert from '../../components/ModalAdvert';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';
import SelectPage from '../../components/SelectPage';
import ButtonGrid from '../../components/ButtonGrid';
import SelectPagination from '../../components/SelectPagination';
import { renderTitle } from '../../clientes/utils/utils';

interface ListarDatosBancariosProps {
  onSelect?: (dato: any) => void;
}

const ListarDatosBancarios = ({ onSelect }: ListarDatosBancariosProps) => {
  const navigate = useNavigate();
  const [datos, setDatos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [loading, setLoading] = useState(false);

  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [advertModalOpen, setAdvertModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const res = await getDatosBancariosPaginated({ page, limit, search });
      setDatos(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Error al obtener datos bancarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setIdToDelete(id);
    setAdvertModalOpen(true);
  };

  const handleEdit = (id: number) => {
    if (onSelect) return;
    navigate(`/datosbancarios/editar/${id}`);
  };

  const confirmDelete = async () => {
    if (idToDelete === null) return;
    try {
      await deleteDatosBancarios(idToDelete);
      setSuccessModalOpen(true);
      fetchDatos();
    } catch (err) {
      console.error(err);
      setErrorMessage('  Error al eliminar dato bancario');
      setErrorModalOpen(true);
    } finally {
      setAdvertModalOpen(false);
      setIdToDelete(null);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [page, limit, search]);

  useAlVolverALaVentana(fetchDatos);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      {/* Header */}
      {renderTitle({
        title: "Datos Bancarios",
        subtitle: "Gestión de cuentas bancarias",
        icon: <FaCreditCard className="text-4xl" />
      })}

      {/* Búsqueda y controles */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* Input de búsqueda */}
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar banco, titular, número..."
              className="
          w-full pl-10 pr-4 py-2
          border-2 border-blue-300 dark:border-gray-600
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          dark:focus:ring-gray-500 dark:focus:border-gray-500
        "
            />
          </div>

          {/* Botones y controles */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/datosbancarios/nuevo')}
              className="
          flex items-center gap-2
          bg-gradient-to-r from-blue-600 to-indigo-600
          hover:from-blue-700 hover:to-indigo-700
          text-white px-5 py-2 rounded-lg
          shadow-md hover:shadow-lg transition-all font-medium
          dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500
        "
            >
              <FaPlus />
              Nuevo Dato Bancario
            </button>

            {/* Componentes reutilizables, asumidos compatibles con dark */}
            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
            <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
          </div>
        </div>
      </div>


      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Lista vacía */}
      {!loading && datos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <FaInfoCircle className="text-gray-400 dark:text-gray-500 text-5xl mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {search
              ? 'No se encontraron datos bancarios con ese criterio de búsqueda'
              : 'No hay datos bancarios registrados'}
          </p>
        </div>
      )}

      {/* Lista */}
      {!loading && datos.length > 0 && (
        <div className={vistaGrid
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          : 'grid grid-cols-1 gap-4'}
        >
          {datos.map((dato) => (
            <div
              key={dato.iddatos_bancarios}
              className="border-2 border-gray-200 dark:border-gray-700
              rounded-xl p-5 bg-white dark:bg-gray-900
              hover:shadow-lg transition-all relative"
            >
              {/* Info banco */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                    <FaUniversity className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate flex-1">
                    {dato.banco_origen}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <FaCreditCard className="text-blue-500" />
                    <span className="truncate">{dato.numero_cuenta}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <FaUser className="text-blue-500" />
                    <span className="truncate">{dato.titular_cuenta}</span>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { title: 'Tipo de Cuenta', text: dato.tipo_cuenta },
                  { title: 'Observación', text: dato.observacion || '--' }
                ].map((card, index) => (
                  <CardText
                    key={index}
                    title={card.title}
                    text={card.text}
                  />
                ))}
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                {/* Botón Seleccionar */}
                {onSelect && (
                  <button
                    onClick={() => onSelect(dato)}
                    className="
        flex-1 flex items-center justify-center gap-2
        px-3 py-2 rounded-lg font-medium shadow-sm text-sm
        bg-blue-600 hover:bg-blue-700 text-white
        transition-all
        dark:bg-gray-700 dark:hover:bg-gray-600
      "
                  >
                    <FaCheckCircle />
                    Seleccionar
                  </button>
                )}

                {/* Botón Editar */}
                <button
                  onClick={() => handleEdit(dato.iddatos_bancarios)}
                  className="
      flex-1 flex items-center justify-center gap-2
      px-3 py-2 rounded-lg font-medium shadow-sm text-sm
      bg-blue-500 hover:bg-blue-600 text-white
      transition-all
      dark:bg-gray-700 dark:hover:bg-gray-600
    "
                >
                  <FaEdit />
                  Editar
                </button>

                {/* Botón Eliminar */}
                <button
                  onClick={() => handleDelete(dato.iddatos_bancarios)}
                  className="
      flex-1 flex items-center justify-center gap-2
      px-3 py-2 rounded-lg font-medium shadow-sm text-sm
      bg-blue-500 hover:bg-blue-600 text-white
      transition-all
      dark:bg-gray-700 dark:hover:bg-gray-600
    "
                >
                  <FaTrash />
                  Eliminar
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />

      {/* Modales */}

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Dato bancario eliminado correctamente"
      />

      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />

      <ModalAdvert
        isOpen={advertModalOpen}
        onClose={() => setAdvertModalOpen(false)}
        message="¿Estás seguro de que deseas eliminar este dato bancario?"
        onConfirm={confirmDelete}
      />

    </div>
  );
}

export default ListarDatosBancarios;
