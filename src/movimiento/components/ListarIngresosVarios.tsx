import { CHAT_IA_HABILITADO } from '../../config/featureFlags';
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { AccionFila, TablaListado } from '../../components/listado/Listado';
import {
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { FaTrash, FaMoneyBillWave } from 'react-icons/fa';
import ChatIngresoModal from './ChatIngresoModal';
import ModalAdvert from '../../components/ModalAdvert';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import {
  getIngresosPaginated,
  deleteIngreso
} from '../../services/ingreso';
import { formatPY } from '../utils/utils';
import type { ParsedIncome } from '../../types/chat';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import ButtonGral from '../../components/ButtonGral';
import SearchActionsBar from '../../components/SearchActionsBar';
import { renderTitle } from '../../clientes/utils/utils';

interface Ingreso {
  idingreso: number;
  monto: number;
  concepto: string;
  fecha: string;
  tipo_ingreso: string;
}

const ListarIngresosVarios = () => {
  const navigate = useNavigate();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isOpenChatIA, setIsOpenChatIA] = useState(false);
  const [showAdvert, setShowAdvert] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ingresoAAnular, setIngresoAAnular] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);


  const fetchIngresos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getIngresosPaginated({
        page,
        limit,
        search,
        fechaDesde,
        fechaHasta
      });
      setIngresos(data.data);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error al obtener ingresos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchIngresos();
  }, [fetchIngresos]);

  useAlVolverALaVentana(fetchIngresos);

  const handleAnularIngreso = (id: number) => {
    setIngresoAAnular(id);
    setShowAdvert(true);
  };

  const confirmarAnulacion = async () => {
    if (!ingresoAAnular) return;
    try {
      await deleteIngreso(ingresoAAnular);
      setSuccessModalOpen(true);
      fetchIngresos();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al anular ingreso';
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setShowAdvert(false);
      setIngresoAAnular(null);
    }
  };

  const handleIngresoRegistradoIA = (ingreso: ParsedIncome) => {
    console.log('  Ingreso registrado por IA:', ingreso);
    setSuccessModalOpen(true);
    fetchIngresos();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto">
        {renderTitle({ title: "Ingresos Varios", subtitle: "Administra los ingresos adicionales", icon: <FaMoneyBillWave className="text-white text-3xl sm:text-4xl" /> })}

        <SearchActionsBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por tipo de ingreso o descripción..."
          extraContent={
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Fecha desde', value: fechaDesde, setter: setFechaDesde },
                { label: 'Fecha hasta', value: fechaHasta, setter: setFechaHasta },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => {
                        setter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                    {value && (
                      <button
                        onClick={() => {
                          setter('');
                          setPage(1);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
        >
          {CHAT_IA_HABILITADO && (<ButtonGral text='Chat IA' onClick={() => setIsOpenChatIA(true)} />)}
          <ButtonGral text='Nuevo Ingreso' onClick={() => navigate('/movimiento/ingreso/nuevo')} />
          <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
        </SearchActionsBar>

        <TablaListado
          columnas={[
            { clave: 'tipo', titulo: 'Tipo', render: (x: any) => <span className="font-semibold">{x.tipo_ingreso}</span> },
            { clave: 'concepto', titulo: 'Concepto', render: (x: any) => x.concepto || '?' },
            { clave: 'monto', titulo: 'Monto', alinear: 'right', sinSalto: true, render: (x: any) => formatPY(x.monto) },
            { clave: 'fecha', titulo: 'Fecha', sinSalto: true, render: (x: any) => formatDate(x.fecha) },
          ]}
          filas={ingresos} claveFila={(x: any) => x.idingreso} cargando={loading}
          vacio={search || fechaDesde || fechaHasta ? 'No se encontraron ingresos con ese criterio.' : 'No hay ingresos registrados.'}
          acciones={(x: any) => <AccionFila onClick={() => handleAnularIngreso(x.idingreso)} icono={<FaTrash />} texto="Anular" tipo="peligro" />}
        />
        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      </div>

      {/* Modales */}
      <ModalAdvert
        isOpen={showAdvert}
        onClose={() => setShowAdvert(false)}
        onConfirm={confirmarAnulacion}
        message="¿Estás seguro de anular este ingreso? Esta acción no se puede deshacer."
        confirmButtonText="Sí, anular"
      />
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Procesado con éxito"
      />
      <ModalError
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
      {CHAT_IA_HABILITADO && (<ChatIngresoModal
        isOpen={isOpenChatIA}
        onClose={() => setIsOpenChatIA(false)}
        onIngresoRegistrado={handleIngresoRegistradoIA}
      />)}
    </div>
  );
};

export default ListarIngresosVarios;
