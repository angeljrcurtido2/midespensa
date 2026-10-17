import { CHAT_IA_HABILITADO } from '../../../config/featureFlags';
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';
import { AccionFila, TablaListado } from '../../../components/listado/Listado';
import {
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { FaTrash, FaMoneyBillWave } from 'react-icons/fa';
import ChatEgresoModal from '../ChatEgresoModal';
import ModalAdvert from '../../../components/ModalAdvert';
import ModalError from '../../../components/ModalError';
import ModalSuccess from '../../../components/ModalSuccess';
import { getEgresosPaginated, deleteEgreso } from '../../../services/egreso';
import { formatPY } from '../../utils/utils';
import type { ParsedExpense } from '../../../types/chat';
import SelectPage from '../../../components/SelectPage';
import SelectPagination from '../../../components/SelectPagination';
import ButtonGral from '../../../components/ButtonGral';
import SearchActionsBar from '../../../components/SearchActionsBar';
import { renderTitle } from '../../../clientes/utils/utils';

interface Egreso {
  idegreso: number;
  monto: number;
  concepto: string;
  fecha: string;
  tipo_egreso: string;
}

const ListarEgresosVarios = () => {
  const navigate = useNavigate();
  const [egresos, setEgresos] = useState<Egreso[]>([]);
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
  const [egresoAAnular, setEgresoAAnular] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);


  const fetchEgresos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getEgresosPaginated({
        page,
        limit,
        search,
        fechaDesde,
        fechaHasta
      });
      setEgresos(data.data);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error al obtener egresos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchEgresos();
  }, [fetchEgresos]);

  useAlVolverALaVentana(fetchEgresos);

  const handleAnularEgreso = (id: number) => {
    setEgresoAAnular(id);
    setShowAdvert(true);
  };

  const confirmarAnulacion = async () => {
    if (!egresoAAnular) return;
    try {
      await deleteEgreso(egresoAAnular);
      setSuccessModalOpen(true);
      fetchEgresos();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al anular egreso';
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setShowAdvert(false);
      setEgresoAAnular(null);
    }
  };

  const handleEgresoRegistradoIA = (egreso: ParsedExpense) => {
    console.log('  Egreso registrado por IA:', egreso);
    setSuccessModalOpen(true);
    fetchEgresos();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {renderTitle({ title: "Egresos Varios", subtitle: "Administra los egresos adicionales", icon: <FaMoneyBillWave className="text-white text-3xl sm:text-4xl" /> })}
        {/* Search and Actions Bar */}
        <SearchActionsBar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por tipo de egreso o descripción..."
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
          <ButtonGral text='Nuevo Egreso' onClick={() => navigate('/movimiento/egreso/nuevo')} />
          <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
        </SearchActionsBar>

        <TablaListado
          columnas={[
            { clave: 'tipo', titulo: 'Tipo', render: (x: any) => <span className="font-semibold">{x.tipo_egreso}</span> },
            { clave: 'concepto', titulo: 'Concepto', render: (x: any) => x.concepto || '?' },
            { clave: 'monto', titulo: 'Monto', alinear: 'right', sinSalto: true, render: (x: any) => formatPY(x.monto) },
            { clave: 'fecha', titulo: 'Fecha', sinSalto: true, render: (x: any) => formatDate(x.fecha) },
          ]}
          filas={egresos} claveFila={(x: any) => x.idegreso} cargando={loading}
          vacio={search || fechaDesde || fechaHasta ? 'No se encontraron egresos con ese criterio.' : 'No hay egresos registrados.'}
          acciones={(x: any) => <AccionFila onClick={() => handleAnularEgreso(x.idegreso)} icono={<FaTrash />} texto="Anular" tipo="peligro" />}
        />
        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      </div>

      {/* Modales */}
      <ModalAdvert
        isOpen={showAdvert}
        onClose={() => setShowAdvert(false)}
        onConfirm={confirmarAnulacion}
        confirmButtonText="Sí, anular"
        message="¿Estás seguro de que deseas anular este egreso? Esta acción no se puede deshacer."
      />
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Anulación procesada con éxito"
      />
      <ModalError
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
      {CHAT_IA_HABILITADO && (<ChatEgresoModal
        visible={isOpenChatIA}
        onClose={() => setIsOpenChatIA(false)}
        onEgresoRegistrado={handleEgresoRegistradoIA}
      />)}
    </div>
  );
};

export default ListarEgresosVarios;
