'use client';

import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';

import { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaSearch, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import ModalAdvert from '../../components/ModalAdvert';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import {
  deleteMovimientoRRHH,
  getMovimientosRRHH,
  type MovimientoRRHH,
  type MovimientosRRHHListParams,
} from '../../services/rrhh';
import ModalCrearMovimientoRRHH from './ModalsMovimientosRRHH/ModalCrearMovimientoRRHH';
import ModalEditarMovimientoRRHH from './ModalsMovimientosRRHH/ModalEditarMovimientoRRHH';

const formatGs = (valor: number | string | null | undefined) => {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? `${Math.round(Math.abs(n)).toLocaleString('es-PY')} Gs` : '--';
};

// El backend puede devolver la fecha en ISO o ya formateada como dd-mm-yyyy.
const formatFechaMov = (valor: string | null | undefined) => {
  if (!valor) return 'N/A';
  const v = String(valor);
  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) return v.replace(/-/g, '/');
  const iso = v.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
  return v;
};

const ListarMovimientosRRHH = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MovimientoRRHH[]>([]);
  const [search, setSearch] = useState('');
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipo, setTipo] = useState<'todos' | 'bono' | 'descuento'>('todos');
  const [estado, setEstado] = useState<'todos' | 'activo' | 'anulado'>('activo');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [idMovimiento] = useState<number | string>('');

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [advertModalOpen, setAdvertModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [advertMessage, setAdvertMessage] = useState('');
  const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: MovimientosRRHHListParams = {
        page,
        limit,
        search: search.trim() || undefined,
        nombre: nombre.trim() || undefined,
        documento: documento.trim() || undefined,
        tipo,
        estado,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      };
      const res = await getMovimientosRRHH(params);
      setItems(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      setErrorMessage('  Error al obtener movimientos RRHH');
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search, nombre, documento, tipo, estado, fechaInicio, fechaFin]);

  useAlVolverALaVentana(() => { void fetchData(); });

  const handleEdit = (id: number | string) => {
    navigate('/movimientos-rrhh/editar/' + id);
  };

  const handleDelete = (id: number | string) => {
    setAdvertMessage('¿Deseás anular este movimiento?');
    setAdvertAction(() => async () => {
      try {
        await deleteMovimientoRRHH(id);
        setSuccessMessage('  Movimiento anulado correctamente');
        setSuccessModalOpen(true);
        fetchData();
      } catch (error) {
        console.error(error);
        setErrorMessage('  No se pudo anular el movimiento');
        setErrorModalOpen(true);
      }
    });
    setAdvertModalOpen(true);
  };

  const handleConfirmAdvert = () => {
    if (advertAction) advertAction();
    setAdvertModalOpen(false);
    setAdvertAction(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold">Bonos/Descuentos</h1>
          <p className="text-sm text-blue-100">Movimientos RRHH que se integran automáticamente en liquidación</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por concepto, monto, empleado..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => navigate('/movimientos-rrhh/nuevo')}
              className="w-full lg:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 justify-center"
            >
              <FaPlus /> Nuevo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
            <input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setPage(1);
              }}
              placeholder="Nombre"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            />
            <input
              value={documento}
              onChange={(e) => {
                setDocumento(e.target.value);
                setPage(1);
              }}
              placeholder="Documento"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            />
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as any);
                setPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            >
              <option value="todos">Tipo (todos)</option>
              <option value="bono">Bono</option>
              <option value="descuento">Descuento</option>
            </select>
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as any);
                setPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            >
              <option value="activo">Activos</option>
              <option value="todos">Estado (todos)</option>
              <option value="anulado">Anulados</option>
            </select>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex flex-col items-stretch gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
            <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <FaInfoCircle className="text-gray-400 dark:text-gray-500 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron movimientos</p>
          </div>
        )}

        {/* Saldo neto de lo que se está viendo: es lo que termina impactando en
            las liquidaciones del período filtrado. Los anulados no suman. */}
        {!loading && items.length > 0 && (() => {
          const activos = items.filter((m) => m.estado === 'activo');
          const bonos = activos
            .filter((m) => m.tipo === 'bono')
            .reduce((acc, m) => acc + Number(m.monto || 0), 0);
          const descuentos = activos
            .filter((m) => m.tipo === 'descuento')
            .reduce((acc, m) => acc + Number(m.monto || 0), 0);
          const neto = bonos - descuentos;

          return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bonos</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  + {formatGs(bonos)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Descuentos</p>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  − {formatGs(descuentos)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Impacto neto</p>
                <p
                  className={`text-lg font-bold ${
                    neto >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {neto >= 0 ? '+' : ''}{formatGs(neto)}
                </p>
              </div>
            </div>
          );
        })()}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {items.map((m) => {
              const esBono = m.tipo === 'bono';
              const anulado = m.estado === 'anulado';
              return (
                <div
                  key={m.idmovimiento}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-l-4 ${
                    anulado
                      ? 'border-l-gray-300 dark:border-l-gray-600 opacity-60'
                      : esBono
                        ? 'border-l-emerald-500'
                        : 'border-l-rose-500'
                  } border-y border-r border-gray-100 dark:border-gray-700`}
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            esBono
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {esBono ? 'Bono' : 'Descuento'}
                        </span>
                        {anulado && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            Anulado
                          </span>
                        )}
                        <p className="font-bold text-gray-800 dark:text-gray-100 truncate">
                          {m.concepto}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {m.nombre ? `${m.nombre} ${m.apellido || ''}`.trim() : `Empleado #${m.idempleado}`}
                        {m.cedula ? ` · ${m.cedula}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fecha: {formatFechaMov(m.fecha)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* El signo hace evidente si suma o resta al sueldo. */}
                      <div
                        className={`px-3 py-2 rounded-lg font-bold whitespace-nowrap ${
                          anulado
                            ? 'bg-gray-100 text-gray-500 line-through dark:bg-gray-700 dark:text-gray-400'
                            : esBono
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                        }`}
                      >
                        {esBono ? '+' : '−'} {formatGs(m.monto)}
                      </div>
                      <button
                        onClick={() => handleEdit(m.idmovimiento)}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <FaEdit /> Editar
                      </button>
                      {!anulado && (
                        <button
                          onClick={() => handleDelete(m.idmovimiento)}
                          className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"
                        >
                          <FaTimesCircle /> Anular
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ModalCrearMovimientoRRHH
        isOpen={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onSuccess={() => {
          setModalCrearOpen(false);
          fetchData();
          setSuccessMessage('  Movimiento creado correctamente');
          setSuccessModalOpen(true);
        }}
      />

      <ModalEditarMovimientoRRHH
        isOpen={modalEditarOpen}
        id={idMovimiento}
        onClose={() => setModalEditarOpen(false)}
        onSuccess={() => {
          setModalEditarOpen(false);
          fetchData();
          setSuccessMessage('  Movimiento actualizado correctamente');
          setSuccessModalOpen(true);
        }}
      />

      <ModalSuccess isOpen={successModalOpen} onClose={() => setSuccessModalOpen(false)} message={successMessage} />
      <ModalError isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={errorMessage} />
      <ModalAdvert
        isOpen={advertModalOpen}
        onClose={() => setAdvertModalOpen(false)}
        onConfirm={handleConfirmAdvert}
        message={advertMessage}
      />
    </div>
  );
};

export default ListarMovimientosRRHH;

