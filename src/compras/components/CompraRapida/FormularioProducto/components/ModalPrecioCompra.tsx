import { FaBoxOpen, FaHashtag } from 'react-icons/fa';

interface ModalPrecioCompraProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (opcion: string) => void;
  setOpcionSeleccionada?: (value: string) => void | undefined;
  opcionSeleccionada?: string;
}

const ModalPrecioCompra: React.FC<ModalPrecioCompraProps> = ({
  isOpen,
  onClose,
  onConfirm,
  setOpcionSeleccionada,
  opcionSeleccionada
}) => {


  const handleConfirm = () => {
    if (opcionSeleccionada) {
      onConfirm(opcionSeleccionada);
      onClose();
    }
  };

  const handleClose = () => {
    setOpcionSeleccionada && setOpcionSeleccionada('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border dark:border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Configuración de Precio de Compra
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Selecciona cómo deseas ingresar el precio de compra para productos por caja:
        </p>

        <div className="space-y-4 mb-6">

          {/* Opción 1 */}
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all
        ${opcionSeleccionada === 'caja_total'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            onClick={() => setOpcionSeleccionada?.('caja_total')}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={opcionSeleccionada === 'caja_total'}
                onChange={() => setOpcionSeleccionada?.('caja_total')}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                  Precio de compra por cada caja
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Ingresa el precio compra que pagaste por cada caja
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <FaBoxOpen className="text-blue-500" />
                    Ejemplo: Producto x caja = $35.000
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    El sistema calculará automáticamente el precio por unidad
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Opción 2 */}
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all
        ${opcionSeleccionada === 'por_unidad'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            onClick={() => setOpcionSeleccionada?.('por_unidad')}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={opcionSeleccionada === 'por_unidad'}
                onChange={() => setOpcionSeleccionada?.('por_unidad')}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                  Precio de compra por unidad individual
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Ingresas el precio de cada unidad dentro de la caja
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border-l-4 border-green-400">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <FaHashtag className="text-green-500" />
                    Ejemplo: Producto x unidad = $3.500
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    El sistema calculará automáticamente el precio total de la caja
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300
        border border-gray-300 dark:border-gray-600
        rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!opcionSeleccionada}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
        ${opcionSeleccionada
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
          >
            Confirmar Selección
          </button>
        </div>
      </div>
    </div>

  );
};

export default ModalPrecioCompra;