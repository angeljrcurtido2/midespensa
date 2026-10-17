import { NumericFormat } from "react-number-format";
import { useEffect } from "react";
import { FaBoxOpen, FaBox, FaTrash, FaBarcode, FaWarehouse, FaTag, FaHashtag } from 'react-icons/fa';

interface Props {
  productos: any[];
  onEditProducto: (index: number, field: string, value: string) => void;
  onDeleteProducto: (index: number) => void;
}

const TablaProductos = ({ productos, onEditProducto, onDeleteProducto }: Props) => {

  // Función para calcular campos automáticamente cuando se edita en la tabla
  const handleEditWithCalculation = (index: number, field: string, value: string) => {
    const producto = productos[index];

    // Si no es producto tipo CAJA, solo actualizar el campo
    if (producto.unidad_medida !== 'CAJA') {
      onEditProducto(index, field, value);
      return;
    }

    // Aplicar la lógica de cálculo para productos tipo CAJA
    const cant_cajas = parseFloat(field === 'cant_cajas' ? value : producto.cant_cajas || '0');
    const cant_p_caja = parseFloat(field === 'cant_p_caja' ? value : producto.cant_p_caja || '0');
    const cantidad = parseFloat(field === 'cantidad' ? value : producto.cantidad || '0');
    const precio_compra = parseFloat(field === 'precio_compra' ? value : producto.precio_compra || '0');
    const precio_compra_caja = parseFloat(field === 'precio_compra_caja' ? value : producto.precio_compra_caja || '0');

    // Primero actualizar el campo que se editó
    onEditProducto(index, field, value);

    // Luego calcular y actualizar campos relacionados
    setTimeout(() => {
      // Calcular cantidad de cajas cuando se modifica cantidad total o unidades por caja
      if (field === 'cantidad' && cant_p_caja > 0 && cantidad > 0) {
        const nuevasCajas = (cantidad / cant_p_caja).toFixed(2);
        onEditProducto(index, 'cant_cajas', nuevasCajas);
      }
      else if (field === 'cant_p_caja' && cant_p_caja > 0 && cantidad > 0) {
        const nuevasCajas = (cantidad / cant_p_caja).toFixed(2);
        onEditProducto(index, 'cant_cajas', nuevasCajas);
      }
      // Calcular cantidad total cuando se modifica cantidad de cajas
      else if (field === 'cant_cajas' && cant_cajas > 0 && cant_p_caja > 0) {
        const nuevaCantidad = (cant_cajas * cant_p_caja).toString();
        onEditProducto(index, 'cantidad', nuevaCantidad);
      }

      //   Calcular precios de COMPRA automáticamente
      if (field === 'precio_compra' && precio_compra > 0 && cant_p_caja > 0) {
        const nuevoPrecioCaja = (precio_compra * cant_p_caja).toFixed(2);
        onEditProducto(index, 'precio_compra_caja', nuevoPrecioCaja);
      }
      else if (field === 'precio_compra_caja' && precio_compra_caja > 0 && cant_p_caja > 0) {
        const nuevoPrecioUnitario = (precio_compra_caja / cant_p_caja).toFixed(4);
        onEditProducto(index, 'precio_compra', nuevoPrecioUnitario);
      }

      // Los precios de VENTA (unidad, pack y caja) son independientes: no se recalculan entre sí.
      // Solo los de compra se relacionan (cuánto te cuesta cada unidad de la caja).
      if (field === 'cant_p_caja' && cant_p_caja > 0 && precio_compra > 0) {
        onEditProducto(index, 'precio_compra_caja', (precio_compra * cant_p_caja).toFixed(2));
      }
    }, 0);
  };

  useEffect(() => {
    console.log(productos)
  }, [productos])

  if (productos.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {productos.map((prod, idx) => (
        <div
          key={idx}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${prod.unidad_medida === 'CAJA'
              ? 'border-orange-200 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500'
              : 'border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
            }`}
        >
          {/* Header con gradiente */}
          <div className={`p-4 ${prod.unidad_medida === 'CAJA'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            } text-white`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-white/20 p-2 rounded-lg">
                  {prod.unidad_medida === 'CAJA' ? <FaBox size={20} /> : <FaBoxOpen size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={prod.nombre_producto}
                    onChange={(e) => onEditProducto(idx, 'nombre_producto', e.target.value)}
                    className="bg-white/20 border-2 border-white/30 rounded-lg text-white font-bold text-base px-3 py-2 w-full focus:bg-white/30 focus:outline-none placeholder-white/70"
                    placeholder="Nombre del producto"
                  />

                </div>
              </div>
              <button
                onClick={() => onDeleteProducto(idx)}
                className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-all"
                title="Eliminar"
              >
                <FaTrash className="text-white" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Número de Lote y Código de barras */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <FaTag className="text-amber-600 dark:text-amber-500" /> N° Lote <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={prod.numero_lote || ''}
                  onChange={(e) => onEditProducto(idx, 'numero_lote', e.target.value)}
                  placeholder="Requerido"
                  className="w-full border-2 border-amber-300 dark:border-amber-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1.5 text-center text-sm font-medium focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1">
                  <FaBarcode /> Código
                </label>
                <div className="px-2 py-1.5 bg-slate-50 dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
                  {prod.cod_barra || 'N/A'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-700 dark:text-blue-300">Presentación comprada</label>
                <select
                  value={prod.presentacion_compra || (prod.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD')}
                  onChange={(e) => {
                    const presentacion = e.target.value;
                    const factor = presentacion === 'CAJA' ? Number(prod.cant_p_caja || 0) : presentacion === 'PACK' ? Number(prod.cant_p_pack || 0) : 1;
                    const costoUnitario = Number(prod.precio_compra || 0);
                    const precio = presentacion === 'CAJA' ? Number(prod.precio_compra_caja || costoUnitario * factor) : presentacion === 'PACK' ? costoUnitario * factor : costoUnitario;
                    onEditProducto(idx, 'presentacion_compra', presentacion);
                    onEditProducto(idx, 'precio_compra_presentacion', String(precio));
                  }}
                  className="w-full rounded-md border px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="UNIDAD">Unidad suelta</option>
                  {Number(prod.cant_p_pack) > 0 && <option value="PACK">Pack ({prod.cant_p_pack} unidades)</option>}
                  {prod.unidad_medida === 'CAJA' && Number(prod.cant_p_caja) > 0 && <option value="CAJA">Caja ({prod.cant_p_caja} unidades)</option>}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-green-700 dark:text-green-300">Costo por presentación</label>
                <NumericFormat
                  value={prod.precio_compra_presentacion ?? (prod.presentacion_compra === 'CAJA' || (!prod.presentacion_compra && prod.unidad_medida === 'CAJA') ? (Number(prod.precio_compra_caja || 0) || Number(prod.precio_compra || 0) * Number(prod.cant_p_caja || 1)) : prod.presentacion_compra === 'PACK' ? Number(prod.precio_compra || 0) * Number(prod.cant_p_pack || 1) : prod.precio_compra)}
                  thousandSeparator="."
                  decimalSeparator="," 
                  decimalScale={0}
                  allowNegative={false}
                  onValueChange={(v) => onEditProducto(idx, 'precio_compra_presentacion', v.value)}
                  className="w-full rounded-md border px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white"
                  prefix="₲ "
                />
              </div>
            </div>

            {/* Cantidades */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1">
                    <FaBox className="text-purple-600 dark:text-purple-500" /> Cantidad {prod.unidad_medida === 'CAJA' && '(Comprada)'}
                  </label>
                  <input
                    type="number"
                    value={prod.cantidad}
                    onChange={(e) => handleEditWithCalculation(idx, 'cantidad', e.target.value)}
                    className="w-full border-2 border-purple-300 dark:border-purple-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-center text-sm px-2 py-1.5 font-bold focus:ring-2 focus:ring-purple-400 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Unidad</label>
                  <div className="px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg text-sm font-bold text-indigo-700 dark:text-indigo-400 text-center">
                    {prod.unidad_medida}
                  </div>
                </div>

              </div>

              {/* Info de CAJA */}
              {prod.unidad_medida === 'CAJA' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <FaBox className="text-emerald-600 dark:text-emerald-500" /> Cajas (Auto)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={prod.cant_cajas}
                      onChange={(e) => handleEditWithCalculation(idx, 'cant_cajas', e.target.value)}
                      className="w-full border-2 border-emerald-300 dark:border-emerald-600 rounded-lg text-center bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 text-sm px-2 py-1.5 font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-orange-700 dark:text-orange-400 font-semibold flex items-center gap-1">
                      <FaHashtag className="text-orange-600 dark:text-orange-500" /> Unid/Caja
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={prod.cant_p_caja}
                      onChange={(e) => handleEditWithCalculation(idx, 'cant_p_caja', e.target.value)}
                      className="w-full border-2 border-orange-300 dark:border-orange-600 dark:bg-gray-700 rounded-lg text-center text-sm px-2 py-1.5 font-bold text-orange-700 dark:text-orange-400 focus:ring-2 focus:ring-orange-400 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 space-y-1">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">P. Compra</p>
                <NumericFormat
                  value={prod.precio_compra}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={0}
                  fixedDecimalScale={false}
                  allowNegative={false}
                  onValueChange={(values) => handleEditWithCalculation(idx, 'precio_compra', values.value || '')}
                  className="w-full border-2 border-blue-300 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-center text-sm px-2 py-1 font-bold focus:ring-2 focus:ring-blue-400 transition-all"
                  prefix="₲ "
                />
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2 space-y-1">
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold">P. Venta</p>
                <NumericFormat
                  value={prod.precio_venta}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={0}
                  fixedDecimalScale={false}
                  allowNegative={false}
                  onValueChange={(values) => handleEditWithCalculation(idx, 'precio_venta', values.value || '')}
                  className="w-full border-2 border-emerald-300 dark:border-emerald-600 dark:bg-gray-700 rounded-lg text-center text-sm px-2 py-1 font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-400 transition-all"
                  prefix="₲ "
                />
              </div>
            </div>

            {/* Precios por CAJA */}
            {prod.unidad_medida === 'CAJA' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-200 dark:border-orange-700">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 space-y-1">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">P. Caja (C)</p>
                  <NumericFormat
                    value={prod.precio_compra_caja}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    fixedDecimalScale={false}
                    allowNegative={false}
                    onValueChange={(values) => handleEditWithCalculation(idx, 'precio_compra_caja', values.value || '')}
                    className="w-full border-2 border-blue-300 dark:border-blue-600 rounded-lg text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-sm px-2 py-1 font-bold text-blue-700 dark:text-blue-400 focus:ring-2 focus:ring-blue-400 transition-all"
                    prefix="₲ "
                  />
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2 space-y-1">
                  <p className="text-xs text-green-700 dark:text-green-400 font-semibold">P. Caja (V)</p>
                  <NumericFormat
                    value={prod.precio_venta_caja}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    fixedDecimalScale={false}
                    allowNegative={false}
                    onValueChange={(values) => handleEditWithCalculation(idx, 'precio_venta_caja', values.value || '')}
                    className="w-full border-2 border-emerald-300 dark:border-emerald-600 rounded-lg text-center bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 text-sm px-2 py-1 font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-400 transition-all"
                    prefix="₲ "
                  />
                </div>
              </div>
            )}

            {/* Ubicación e IVA */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1">
                  <FaWarehouse /> Ubicación
                </label>
                <select
                  value={prod.ubicacion_almacen || 'PRINCIPAL'}
                  onChange={(e) => onEditProducto(idx, 'ubicacion_almacen', e.target.value)}
                  className="w-full border-2 border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-400 transition-all cursor-pointer"
                >
                  <option value="PRINCIPAL">Principal</option>
                  <option value="ESTANTE-A1">A1</option>
                  <option value="ESTANTE-A2">A2</option>
                  <option value="ESTANTE-A3">A3</option>
                  <option value="REFRIGERADOR">Refrig</option>
                  <option value="BODEGA">Bodega</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaTag className="text-amber-600 dark:text-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{prod.iva}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TablaProductos;
