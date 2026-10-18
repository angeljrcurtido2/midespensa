'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { FaCalendarCheck, FaSearch, FaEdit, FaTrash, FaClock, FaPlus } from 'react-icons/fa';
import { deleteAsistencia, getAsistencias, getEmpleados, type Empleado, type Asistencia } from '../../services/rrhh';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import ButtonGrid from '../../components/ButtonGrid';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';
import ButtonGral from '../../components/ButtonGral';
import {
  styleCardSmall,
  styleSearchDark,
  styleTxtCards,
  styleTxtLabelBold,
} from '../../components/utils/stylesGral';

/**
 * Horas de la jornada a partir de entrada y salida. Devuelve null si faltan
 * datos. Contempla el turno que cruza la medianoche (salida < entrada), como
 * el registro existente de 14:45 a 00:47.
 */
const calcularHorasJornada = (
  entrada: string | null | undefined,
  salida: string | null | undefined,
): number | null => {
  if (!entrada || !salida) return null;
  const [he, me] = entrada.split(':').map(Number);
  const [hs, ms] = salida.split(':').map(Number);
  if ([he, me, hs, ms].some((n) => !Number.isFinite(n))) return null;
  let minutos = hs * 60 + ms - (he * 60 + me);
  if (minutos < 0) minutos += 24 * 60;
  return Math.round((minutos / 60) * 100) / 100;
};

const getEstadoBadgeColor = (estado: string) => {
  const v = (estado || '').toLowerCase();
  if (v === 'presente') return 'bg-green-100 text-green-700 border-green-300';
  if (v === 'tardanza') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  if (v === 'permiso') return 'bg-blue-100 text-blue-700 border-blue-300';
  return 'bg-red-100 text-red-700 border-red-300';
};

const ListarAsistencia = () => {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [idempleado, setIdempleado] = useState<string>('');
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [loading, setLoading] = useState(false);


  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | string>('');

  const fetchEmpleados = useCallback(async () => {
    try {
      const res = await getEmpleados({ page: 1, limit: 200 });
      setEmpleados(res.data.data || []);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      setErrorMessage('  No se pudo cargar el listado de empleados');
    }
  }, []);

  const fetchAsistencias = useCallback(async () => {
    const empleadoSeleccionado = empleados.find(
      (emp) => String(emp.idempleado) === idempleado,
    );

    const params: {
      page: number;
      limit: number;
      search?: string;
      nombre?: string;
      documento?: string;
    } = {
      page,
      limit,
    };

    if (search.trim()) params.search = search.trim();
    if (empleadoSeleccionado?.nombre) params.nombre = empleadoSeleccionado.nombre;
    if (empleadoSeleccionado?.cedula) params.documento = empleadoSeleccionado.cedula;

    try {
      setLoading(true);
      const res = await getAsistencias(params);
      setAsistencias(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
      setErrorMessage('  No se pudo cargar la lista de asistencias');
    } finally {
      setLoading(false);
    }
  }, [empleados, idempleado, page, limit, search]);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  useAlVolverALaVentana(fetchAsistencias);

  const handleEdit = (id: number | string) => {
    navigate(`/asistencia/editar/${id}`);
  };

  const handleDelete = (id: number | string) => {
    setIdToDelete(id);
    setModalAdvertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;

    try {
      await deleteAsistencia(idToDelete);
      setSuccessMessage('  Asistencia eliminada exitosamente');
      fetchAsistencias();
    } catch (error) {
      console.error('Error al eliminar asistencia:', error);
      setErrorMessage('  No se pudo eliminar la asistencia');
    } finally {
      setModalAdvertOpen(false);
      setIdToDelete('');
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-5">
            <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 md:p-5 rounded-2xl shrink-0">
              <FaCalendarCheck className="text-white text-2xl sm:text-3xl md:text-4xl" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-1">
                Gestión de Asistencias
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-blue-100">
                Administrá la asistencia de cada empleado
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                <input
                  type="text"
                  placeholder="Buscar por estado u observacion..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={styleSearchDark}
                />
              </div>

              <div className="flex items-center gap-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 dark:bg-gray-700">
                <FaClock className="text-gray-500 dark:text-gray-300" />
                <select
                  value={idempleado}
                  onChange={(e) => {
                    setIdempleado(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  <option value="">Seleccionar empleado...</option>
                  {empleados.map((emp) => (
                    <option key={emp.idempleado} value={emp.idempleado}>
                      {emp.nombre} {emp.apellido}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <ButtonGral text="Nueva Asistencia" onClick={() => navigate('/asistencia/nueva')} icon={<FaPlus />} />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && asistencias.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-300 shadow">
            No se encontraron asistencias.
          </div>
        )}

        {/* Días presentes y horas acumuladas: es exactamente lo que la
            liquidación va a computar para jornal y pago por hora. */}
        {!loading && asistencias.length > 0 && (() => {
          const presentes = asistencias.filter((a) => a.estado === 'Presente');
          const totalHoras = asistencias.reduce(
            (acc, a) => acc + (calcularHorasJornada(a.hora_entrada, a.hora_salida) || 0),
            0,
          );
          const ausentes = asistencias.filter((a) => a.estado === 'Ausente').length;

          return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Días presentes</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {presentes.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ausencias</p>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{ausentes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Horas trabajadas</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(totalHoras * 100) / 100} hs
                </p>
              </div>
            </div>
          );
        })()}

        {!loading && asistencias.length > 0 && (
          <div className={vistaGrid ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4' : 'grid grid-cols-1 gap-3'}>
            {asistencias.map((asistencia) => (
              <div
                key={asistencia.idasistencia}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500"
              >
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 text-white">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base truncate">
                      Fecha: {asistencia.fecha || 'N/A'}
                    </h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getEstadoBadgeColor(asistencia.estado)}`}>
                      {asistencia.estado}
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 space-y-3">
                  {/* Las horas trabajadas son la base del pago por hora, y hasta
                      ahora había que calcularlas mentalmente desde entrada y
                      salida. */}
                  {(() => {
                    const horas = calcularHorasJornada(
                      asistencia.hora_entrada,
                      asistencia.hora_salida,
                    );
                    if (horas === null) return null;
                    return (
                      <div className="rounded-lg p-3 border-2 border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {asistencia.hora_entrada?.slice(0, 5)} a {asistencia.hora_salida?.slice(0, 5)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Jornada trabajada</p>
                        </div>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                          {horas} hs
                        </p>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-2">
                    <CardText title="Entrada" text={asistencia.hora_entrada || 'N/A'} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />
                    <CardText title="Salida" text={asistencia.hora_salida || 'N/A'} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />
                    <CardText title="Estado" text={asistencia.estado || 'N/A'} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />
                    <CardText title="Observacion" text={asistencia.observacion || 'Sin observacion'} containerClass={styleCardSmall} titleClass={styleTxtCards} textClass={styleTxtLabelBold} />
                  </div>

                  <div className="pt-3 border-t border-blue-100 dark:border-gray-600">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(asistencia.idasistencia)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <FaEdit /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(asistencia.idasistencia)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <FaTrash /> Borrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      </div>

      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
      <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage('')} message={successMessage} />
      <ModalAdvert
        isOpen={modalAdvertOpen}
        onClose={() => setModalAdvertOpen(false)}
        message="Estas seguro de que deseas eliminar esta asistencia?"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ListarAsistencia;
