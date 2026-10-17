// productos/components/DetallesProducto.tsx
import { useState, useEffect } from 'react';
import { FiTrash2, FiPlus } from "react-icons/fi";
import { FaBox } from "react-icons/fa";
import { getDetalles, guardarDetalles, type DetalleProducto } from '../../services/productoDetalle';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import { renderTitle } from '../../clientes/utils/utils';

interface Props {
  idproducto: number;
  nombre_producto: string;
  /** Stock total del producto, para avisar si los atributos no suman lo mismo. */
  stockProducto?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const DetallesProducto = ({ idproducto, nombre_producto, stockProducto, onClose, onSuccess }: Props) => {
  const [detalles, setDetalles] = useState<DetalleProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    cargarDetalles();
  }, [idproducto]);

  const cargarDetalles = async () => {
    try {
      const response = await getDetalles(idproducto);
      if (response.detalles && response.detalles.length > 0) {
        setDetalles(response.detalles);
      }
    } catch (error: any) {
      console.error('Error al cargar detalles:', error);
    }
  };

  const agregarDetalle = () => {
    setDetalles([...detalles, { atributo: detalles[detalles.length - 1]?.atributo || '', valor: '', cantidad: 0 }]);
  };

  const actualizarDetalle = (index: number, field: keyof DetalleProducto, value: string | number) => {
    const nuevos = [...detalles];
    if (field === 'cantidad') {
      nuevos[index][field] = Math.max(0, parseInt(value as string) || 0);
    } else {
      nuevos[index][field] = value as string;
    }
    setDetalles(nuevos);
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (detalles.length === 0) {
      setErrorMessage('Debe agregar al menos un detalle o cerrar sin guardar');
      setErrorModalOpen(true);
      return;
    }

    const invalidos = detalles.filter(d => !d.atributo || !d.valor || d.cantidad < 0);
    if (invalidos.length > 0) {
      setErrorMessage('Todos los detalles deben tener atributo, valor y stock válido (0 o más)');
      setErrorModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      await guardarDetalles(idproducto, detalles);
      setSuccessMessage('Detalles guardados correctamente');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error al guardar detalles:', error);
      setErrorMessage(error.response?.data?.error || 'Error al guardar detalles');
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        {renderTitle ({title:"Detalles del producto", subtitle: nombre_producto, icon: <FaBox className="text-white text-lg sm:text-xl md:text-2xl" />}) }

        {/* Contenido */}
        <div className="p-3 dark:from-slate-900 dark:to-slate-800 sm:p-4 lg:p-6 overflow-y-auto flex-1 bg-gradient-to-br from-slate-50 to-blue-50">

          {/* Vista Mobile/Tablet: Cards (visible hasta lg) */}
          <div className="block lg:hidden space-y-3 md:space-y-4">
            {detalles.length === 0 ? (
              <div className="px-4 py-8 text-center text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700">
                No hay detalles. Toca "Agregar Detalle" para comenzar.
              </div>
            ) : (
              detalles.map((detalle, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 dark:border-slate-700 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <span className="text-xs dark:text-blue-400 dark:bg-slate-700 sm:text-sm md:text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 md:px-3 md:py-1.5 rounded">
                      Detalle #{idx + 1}
                    </span>
                    <button
                      onClick={() => eliminarDetalle(idx)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 p-1.5 sm:p-2 md:p-2 rounded-lg transition-all"
                      title="Eliminar detalle"
                    >
                      <FiTrash2 size={18} className="sm:w-5 sm:h-5 md:w-5 md:h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm md:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 md:mb-1.5">Atributo</label>
                      <input
                        type="text"
                        value={detalle.atributo}
                        onChange={(e) => actualizarDetalle(idx, 'atributo', e.target.value)}
                        placeholder="ej: Color, Sabor, Tamaño"
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base border border-blue-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 md:mb-1.5">Valor</label>
                      <input
                        type="text"
                        value={detalle.valor}
                        onChange={(e) => actualizarDetalle(idx, 'valor', e.target.value)}
                        placeholder="ej: Rojo, Frutilla, Grande"
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base border border-blue-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm md:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 md:mb-1.5">Stock de este valor</label>
                      <input
                        type="number"
                        min="1"
                        value={detalle.cantidad}
                        onChange={(e) => actualizarDetalle(idx, 'cantidad', e.target.value)}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base border border-blue-300 dark:border-slate-600 rounded-lg text-center bg-white dark:bg-slate-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista Desktop: Tabla (visible en lg y mayor - 1024px+) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full border border-blue-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-800">
                <tr>
                  <th className="px-4 py-3 border border-blue-200 dark:border-slate-600 text-left text-blue-700 dark:text-blue-400 font-semibold text-sm xl:text-base">Atributo</th>
                  <th className="px-4 py-3 border border-blue-200 dark:border-slate-600 text-left text-blue-700 dark:text-blue-400 font-semibold text-sm xl:text-base">Valor</th>
                  <th className="px-4 py-3 border border-blue-200 dark:border-slate-600 text-center w-28 xl:w-32 text-blue-700 dark:text-blue-400 font-semibold text-sm xl:text-base">Stock</th>
                  <th className="px-4 py-3 border border-blue-200 dark:border-slate-600 text-center w-20 xl:w-24 text-blue-700 dark:text-blue-400 font-semibold text-sm xl:text-base">Acción</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-slate-800">
                      No hay detalles. Haz clic en "Agregar Detalle" para comenzar.
                    </td>
                  </tr>
                ) : (
                  detalles.map((detalle, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800">
                      <td className="px-4 py-2 border border-blue-200 dark:border-slate-600">
                        <input
                          type="text"
                          value={detalle.atributo}
                          onChange={(e) => actualizarDetalle(idx, 'atributo', e.target.value)}
                          placeholder="ej: Color, Sabor, Tamaño"
                          className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-4 py-2 border border-blue-200 dark:border-slate-600">
                        <input
                          type="text"
                          value={detalle.valor}
                          onChange={(e) => actualizarDetalle(idx, 'valor', e.target.value)}
                          placeholder="ej: Rojo, Frutilla, Grande"
                          className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-4 py-2 border border-blue-200 dark:border-slate-600">
                        <input
                          type="number"
                          min="1"
                          value={detalle.cantidad}
                          onChange={(e) => actualizarDetalle(idx, 'cantidad', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-slate-600 rounded-lg text-center bg-white dark:bg-slate-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-4 py-2 border border-blue-200 dark:border-slate-600 text-center">
                        <button
                          onClick={() => eliminarDetalle(idx)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-all"
                          title="Eliminar detalle"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {detalles.length > 0 && (() => {
            const suma = detalles.reduce((a, d) => a + (Number(d.cantidad) || 0), 0);
            const hayStock = stockProducto !== undefined && Number.isFinite(Number(stockProducto));
            const cuadra = !hayStock || suma === Number(stockProducto);
            return (
              <div className={`mt-3 rounded-lg px-4 py-3 text-sm font-semibold ${cuadra ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                {hayStock ? `Los atributos suman ${suma} · stock del producto ${stockProducto}${cuadra ? ' ✓' : ''}` : `Los atributos suman ${suma} unidades`}
                {!cuadra && <div className="text-xs font-normal mt-1">No coinciden: ajustá el stock de cada valor para que sumen lo que hay en el producto. Al comprar y vender se reparte entre ellos.</div>}
              </div>
            );
          })()}

          {/* Botón agregar */}
          <button
            onClick={agregarDetalle}
            className="mt-3 sm:mt-4 md:mt-4 px-4 sm:px-5 md:px-5 py-2 sm:py-2.5 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm sm:text-base md:text-base font-medium shadow-md hover:shadow-lg transition-all"
          >
            <FiPlus size={18} className="sm:w-5 sm:h-5 md:w-5 md:h-5" />
            Agregar Detalle
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-3 border-t border-blue-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 md:px-6 py-2 sm:py-2.5 md:py-2.5 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-800 dark:text-gray-100 rounded-lg text-sm sm:text-base md:text-base font-medium shadow-sm hover:shadow-md transition-all order-2 sm:order-1"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-6 md:px-6 py-2 sm:py-2.5 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm sm:text-base md:text-base font-medium disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all order-1 sm:order-2"
          >
            {loading ? 'Guardando...' : 'Guardar Detalles'}
          </button>
        </div>
      </div>

      <ModalSuccess
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />

      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default DetallesProducto;
