'use client';

import { useCallback, useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaEdit, FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import {
  createDetalleLiquidacion,
  deleteDetalleLiquidacion,
  getDetallesByLiquidacion,
  updateDetalleLiquidacion,
  type DetalleLiquidacion,
} from '../../services/rrhh';
import { formatGs } from '../../salarios/utils/calculoSalario';
import ModalAdvert from '../../components/ModalAdvert';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';

interface GestionDetalleLiquidacionProps {
  idliquidacion: number | string;
}

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

type TipoDetalle = 'Ingreso' | 'Descuento';

// El enum de la tabla es exactamente ('Ingreso','Descuento'), con mayúscula
// inicial. El formulario mandaba 'ingreso'/'descuento' en minúscula, y el
// backend valida ese valor sin normalizar: cada intento de crear un detalle
// devolvía 400 "tipo invalido" sin que el usuario llegara a verlo, porque el
// catch de más abajo mostraba un mensaje genérico en vez del `message` real.
const TIPOS: {
  valor: TipoDetalle;
  label: string;
  ayuda: string;
  activo: string;
  texto: string;
}[] = [
  {
    valor: 'Ingreso',
    label: 'Ingreso',
    ayuda: 'Suma al total a cobrar',
    activo: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    texto: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    valor: 'Descuento',
    label: 'Descuento',
    ayuda: 'Resta del total a cobrar',
    activo: 'border-rose-600 bg-rose-50 dark:bg-rose-900/30',
    texto: 'text-rose-700 dark:text-rose-300',
  },
];

const initialForm = {
  concepto: '',
  tipo: 'Ingreso' as TipoDetalle,
  monto: '',
};

const mensajeError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as { response?: { data?: { message?: string } } }).response;
    return r?.data?.message || fallback;
  }
  return fallback;
};

const GestionDetalleLiquidacion = ({ idliquidacion }: GestionDetalleLiquidacionProps) => {
  const [detalles, setDetalles] = useState<DetalleLiquidacion[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const fetchDetalles = useCallback(async () => {
    if (!idliquidacion) return;

    try {
      setLoading(true);
      const res = await getDetallesByLiquidacion(idliquidacion, { page, limit, search });
      setDetalles(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error al obtener detalles de liquidacion:', error);
      setErrorMessage(mensajeError(error, 'No se pudieron cargar los detalles de la liquidación'));
    } finally {
      setLoading(false);
    }
  }, [idliquidacion, page, limit, search]);

  useEffect(() => {
    fetchDetalles();
  }, [fetchDetalles]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(formData.monto);
    if (!formData.concepto.trim()) {
      setErrorMessage('El concepto es obligatorio');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorMessage('El monto debe ser mayor a 0');
      return;
    }

    setGuardando(true);
    try {
      if (editId) {
        await updateDetalleLiquidacion(editId, {
          concepto: formData.concepto.trim(),
          tipo: formData.tipo,
          monto,
        });
        setSuccessMessage('Detalle actualizado correctamente');
      } else {
        await createDetalleLiquidacion({
          idliquidacion: Number(idliquidacion),
          concepto: formData.concepto.trim(),
          tipo: formData.tipo,
          monto,
        });
        setSuccessMessage('Detalle creado correctamente');
      }

      resetForm();
      fetchDetalles();
    } catch (error) {
      console.error('Error al guardar detalle de liquidacion:', error);
      setErrorMessage(mensajeError(error, 'No se pudo guardar el detalle'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = (detalle: DetalleLiquidacion) => {
    // Un registro cargado antes de esta corrección podía tener el tipo en
    // minúscula (si el update lo dejó pasar) o vacío; se cae a 'Ingreso' para
    // que el selector siempre tenga un valor real de los dos válidos.
    const tipoValido = TIPOS.some((t) => t.valor === detalle.tipo);
    setEditId(detalle.iddetalle);
    setFormData({
      concepto: detalle.concepto || '',
      tipo: tipoValido ? (detalle.tipo as TipoDetalle) : 'Ingreso',
      monto: String(detalle.monto ?? ''),
    });
  };

  const handleDelete = (id: number) => {
    setIdToDelete(id);
    setModalAdvertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;

    try {
      await deleteDetalleLiquidacion(idToDelete);
      setSuccessMessage('Detalle eliminado correctamente');
      fetchDetalles();
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      setErrorMessage(mensajeError(error, 'No se pudo eliminar el detalle'));
    } finally {
      setIdToDelete(null);
      setModalAdvertOpen(false);
    }
  };

  const totalIngresos = detalles
    .filter((d) => d.tipo === 'Ingreso')
    .reduce((acc, d) => acc + toNumber(d.monto), 0);

  const totalDescuentos = detalles
    .filter((d) => d.tipo === 'Descuento')
    .reduce((acc, d) => acc + toNumber(d.monto), 0);

  const inputClass =
    'border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-all';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Buscar por concepto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`w-full ${inputClass}`}
          />
        </div>
        <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-blue-100 dark:border-gray-700 space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, tipo: t.valor }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.tipo === t.valor
                  ? t.activo
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  formData.tipo === t.valor ? t.texto : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {t.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.ayuda}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={formData.concepto}
            onChange={(e) => setFormData((prev) => ({ ...prev, concepto: e.target.value }))}
            placeholder="Concepto"
            className={inputClass}
            required
          />
          <NumericFormat
            value={formData.monto}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            onValueChange={(values) =>
              setFormData((prev) => ({ ...prev, monto: values.value || '' }))
            }
            className={inputClass}
            prefix="Gs. "
            placeholder="Monto"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {editId ? <><FaSave /> Actualizar</> : <><FaPlus /> Agregar</>}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Total ingresos</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {formatGs(totalIngresos)}
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-900/40 rounded-xl p-3">
          <p className="text-xs text-rose-700 dark:text-rose-300">Total descuentos</p>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
            {formatGs(totalDescuentos)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
              <tr>
                <th className="text-left px-3 py-2">Concepto</th>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-right px-3 py-2">Monto</th>
                <th className="text-center px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && detalles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-300">
                    Sin conceptos adicionales cargados.
                  </td>
                </tr>
              )}
              {!loading &&
                detalles.map((detalle) => (
                  <tr key={detalle.iddetalle} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2">{detalle.concepto}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          detalle.tipo === 'Ingreso'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {detalle.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatGs(detalle.monto)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(detalle)}
                          className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(detalle.iddetalle)}
                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />

      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
      <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage('')} message={successMessage} />
      <ModalAdvert
        isOpen={modalAdvertOpen}
        onClose={() => setModalAdvertOpen(false)}
        message="¿Estás seguro de que deseas eliminar este concepto?"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default GestionDetalleLiquidacion;
