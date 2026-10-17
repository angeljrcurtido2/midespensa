import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaBox, FaBoxOpen, FaTrash, FaHashtag, FaDollarSign, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import ModalAdvert from '../../../components/ModalAdvert';
import ModalRepartoAtributos, { textoReparto, sumaReparto, type RepartoItem } from '../../../components/ModalRepartoAtributos';
import ModalAtributosNuevos, { textoAtributosNuevos, sumaAtributosNuevos, type AtributoNuevo } from '../../../components/ModalAtributosNuevos';
import { getDetalles, type DetalleProductoResponse } from '../../../services/productoDetalle';

// Unidades de stock que entran: cantidad de la presentación elegida × unidades por presentación.
const unidadesQueEntran = (d: any) => {
  const p = d.presentacion_compra || (d.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD');
  const factor = p === 'CAJA' ? Number(d.cant_p_caja) || 1 : p === 'PACK' ? Number(d.cant_p_pack) || 1 : 1;
  return (Number(d.cantidad) || 0) * factor;
};

interface Props {
  detalles: any[];
  setDetalles: (data: any[]) => void;
}

const DetallesProductos: FC<Props> = ({ detalles, setDetalles }) => {
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [atributosPorProducto, setAtributosPorProducto] = useState<Record<number, DetalleProductoResponse[]>>({});
  const [repartoAbierto, setRepartoAbierto] = useState<number | null>(null);
  const [nuevosAbierto, setNuevosAbierto] = useState<number | null>(null);
  const [pendingChange, setPendingChange] = useState<{ index: number; field: 'precio' | 'precio_compra_caja' } | null>(null);

  useEffect(() => {
    const needsInit = detalles.some(
      (d) => d.precio_inicial === undefined || d.precio_compra_caja_inicial === undefined
    );
    if (!needsInit) return;
    setDetalles(detalles.map((d) => {
      if (d.precio_inicial !== undefined && d.precio_compra_caja_inicial !== undefined) return d;
      return {
        ...d,
        precio_inicial: d.precio_inicial ?? d.precio ?? '',
        precio_compra_caja_inicial: d.precio_compra_caja_inicial ?? d.precio_compra_caja ?? '',
      };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalles.length]);
  const applyDetalleChange = (index: number, field: string, value: string, confirmPriceChange = false) => {
    const updated = [...detalles];
    updated[index][field] = value;

    // Si es un producto con unidad_medida CAJA, calcular precio automáticamente
    if (updated[index].unidad_medida === 'CAJA') {
      const precioCaja = parseFloat(updated[index].precio_compra_caja || '0');
      const cantCajas = parseFloat(updated[index].cant_p_caja || '1');

      // Calcular precio unitario automáticamente
      if (cantCajas > 0) {
        updated[index].precio = (precioCaja / cantCajas).toString();
      }
    }

    if (confirmPriceChange) {
      if (field === 'precio') {
        updated[index].precio_confirmado = true;
      }
      if (field === 'precio_compra_caja') {
        updated[index].precio_compra_caja_confirmado = true;
      }
    }

    setDetalles(updated);
  };

  const updateDetalle = (index: number, field: string, value: string) => {
    applyDetalleChange(index, field, value);
  };

  // Productos con atributos (color, sabor...): hay que repartir las unidades que entran.
  const idsProductos = detalles.map((d) => d.idproducto || '').join(',');
  useEffect(() => {
    const ids = Array.from(new Set(detalles.map((d) => Number(d.idproducto)).filter((id) => id > 0)));
    let activo = true;
    Promise.all(ids.map((id) => getDetalles(id).then((r) => [id, (r.detalles || []) as DetalleProductoResponse[]] as const).catch(() => [id, []] as const))).then((pares) => {
      if (activo) setAtributosPorProducto(Object.fromEntries(pares));
    });
    return () => {
      activo = false;
    };
  }, [idsProductos]);

  const incrementarLote = (numeroLote: string | number | undefined) => {
    const actual = parseInt(String(numeroLote || '0'), 10);
    if (Number.isNaN(actual)) return '1';
    return String(actual + 1);
  };

  const handleToggleModificarPrecio = (index: number, field: 'precio' | 'precio_compra_caja') => {
    const current = detalles[index] || {};
    const confirmedField = field === 'precio' ? 'precio_confirmado' : 'precio_compra_caja_confirmado';
    if (current[confirmedField]) {
      const updated = [...detalles];
      updated[index][confirmedField] = false;
      setDetalles(updated);
      return;
    }

    setPendingChange({ index, field });
    setModalAdvertOpen(true);
  };

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const calcularSubtotal = (d: any) => {
    if (d.presentacion_compra) {
      const costoBase = Number(d.precio || 0);
      const costo = Number(d.precio_compra_presentacion ?? (d.presentacion_compra === 'CAJA' ? (Number(d.precio_compra_caja || 0) || costoBase * Number(d.cant_p_caja || 1)) : d.presentacion_compra === 'PACK' ? costoBase * Number(d.cant_p_pack || 1) : costoBase));
      return costo * Number(d.cantidad || 0);
    }
    if (d.unidad_medida === 'CAJA') {
      return parseFloat(d.precio_compra_caja || '0') * parseFloat(d.cantidad || '0');
    }
    return parseFloat(d.precio || '0') * parseFloat(d.cantidad || '0');
  };

  console.log("Detalles de compra", detalles)

  return (
    <div className="">
      {detalles.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg xl:p-0 md:p-0 lg:p-0 p-0 mb-6 border-2 border-blue-200 dark:border-gray-700 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-full">
              <FaExclamationTriangle className="text-blue-500 dark:text-blue-400" size={48} />
            </div>
            <div>
              <h3 className="text-xl md:text-xs lg:text-xs xl:text-xs font-bold text-slate-700 dark:text-gray-200 mb-2">No hay productos agregados</h3>
              <p className="text-sm md:text-xs lg:text-xs xl:text-xs text-slate-600 dark:text-gray-400">Utilizá el formulario de arriba para agregar productos al inventario</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl shadow-xl overflow-hidden dark:border dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-gray-700 dark:to-gray-800 rounded-t-lg p-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaBoxOpen className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Productos Seleccionados</h3>
                <div className="flex flex-row gap-3">
                  <p className="text-sm text-white mt-1">Productos en compra:</p>
                  <span className="bg-white/30 px-3 py-0.5 rounded-full text-sm font-bold text-white">
                    {detalles.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 max-h-[500px] overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-950">
            {detalles.map((d, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${d.unidad_medida === 'CAJA'
                  ? 'border-orange-200 hover:border-orange-400 dark:border-orange-700 dark:hover:border-orange-500'
                  : 'border-blue-100 hover:border-blue-300 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
              >
                {/* Header del Card con gradiente */}
                <div
                  className={`p-4 ${d.unidad_medida === 'CAJA'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    } text-white`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                        <FaBox className="text-white" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate">{d.nombre_producto}</h4>
                        <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/30">
                          {d.unidad_medida || 'UNIDAD'}
                        </span>
                      </div>
                    </div>
                    {/* type="button": está dentro del <form> de Nueva Compra. Sin type,
                        quitar un producto de la lista disparaba el registro de la compra. */}
                    <button
                      type="button"
                      onClick={() => removeDetalle(idx)}
                      className="ml-3 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar producto"
                    >
                      <FaTrash className="text-white" size={16} />
                    </button>
                  </div>
                </div>

                {/* Grid de Campos */}
                <div className="p-4">
                  {String(d.idproducto).startsWith('temp-') && (() => {
                    const unidades = unidadesQueEntran(d);
                    const tiene = Array.isArray(d.atributos_nuevos) && d.atributos_nuevos.length > 0;
                    const completo = tiene && sumaAtributosNuevos(d.atributos_nuevos) === unidades;
                    return (
                      <button
                        type="button"
                        onClick={() => setNuevosAbierto(idx)}
                        className="mb-4 w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold border-2 rounded-lg bg-purple-50 dark:bg-gray-700 border-purple-300 dark:border-gray-600 text-purple-900 dark:text-gray-200 hover:bg-purple-100"
                      >
                        <span>
                          {tiene ? 'Atributos' : 'Definir atributos (color, sabor…) — opcional'}
                          {tiene && <span className="ml-2 font-bold text-purple-700">({textoAtributosNuevos(d.atributos_nuevos)})</span>}
                        </span>
                        {tiene && (
                          <span className={`${completo ? 'bg-purple-600' : 'bg-amber-500'} text-white text-xs px-2.5 py-1 rounded-full`}>
                            {completo ? '✓ Repartido' : 'Falta repartir'}
                          </span>
                        )}
                      </button>
                    );
                  })()}
                  {(atributosPorProducto[Number(d.idproducto)] || []).length > 0 && (() => {
                    const unidades = unidadesQueEntran(d);
                    const completo = unidades > 0 && sumaReparto(d.atributos) === unidades;
                    return (
                      <button
                        type="button"
                        onClick={() => setRepartoAbierto(idx)}
                        className="mb-4 w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold border-2 rounded-lg bg-purple-50 dark:bg-gray-700 border-purple-300 dark:border-gray-600 text-purple-900 dark:text-gray-200 hover:bg-purple-100"
                      >
                        <span>
                          Repartir por atributo
                          {Array.isArray(d.atributos) && d.atributos.length > 0 && (
                            <span className="ml-2 font-bold text-purple-700">({textoReparto(d.atributos, atributosPorProducto[Number(d.idproducto)])})</span>
                          )}
                        </span>
                        <span className={`${completo ? 'bg-purple-600' : 'bg-amber-500'} text-white text-xs px-2.5 py-1 rounded-full`}>
                          {completo ? '✓ Repartido' : 'Falta repartir'}
                        </span>
                      </button>
                    );
                  })()}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Número de Lote */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <FaHashtag size={12} />
                        N° Lote
                      </label>
                      <input
                        type="text"
                        data-campo={`lote-${idx}`}
                        value={d.numero_lote || ''}
                        onChange={(e) => updateDetalle(idx, 'numero_lote', e.target.value)}
                        placeholder="01"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Presentación comprada</label>
                      <select
                        value={d.presentacion_compra || (d.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD')}
                        onChange={(e) => {
                          const presentacion = e.target.value;
                          const factor = presentacion === 'CAJA' ? Number(d.cant_p_caja || 0) : presentacion === 'PACK' ? Number(d.cant_p_pack || 0) : 1;
                          const costoUnitario = Number(d.precio || d.precio_compra || 0);
                          const precio = presentacion === 'CAJA' ? Number(d.precio_compra_caja || costoUnitario * factor) : presentacion === 'PACK' ? costoUnitario * factor : costoUnitario;
                          const updated = [...detalles];
                          updated[idx] = { ...updated[idx], presentacion_compra: presentacion, precio_compra_presentacion: String(precio) };
                          setDetalles(updated);
                        }}
                        className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="UNIDAD">Unidad suelta</option>
                        {Number(d.cant_p_pack) > 0 && <option value="PACK">Pack ({d.cant_p_pack} unidades)</option>}
                        {d.unidad_medida === 'CAJA' && Number(d.cant_p_caja) > 0 && <option value="CAJA">Caja ({d.cant_p_caja} unidades)</option>}
                      </select>
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cantidad ({d.presentacion_compra === 'CAJA' ? 'cajas' : d.presentacion_compra === 'PACK' ? 'packs' : 'unidades'})
                      </label>
                      {/* step 0.1 dejaba el form :invalid con cantidades como 0.25 (250 g)
                          y el navegador bloqueaba el submit sin mostrar ningún error. */}
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={d.cantidad}
                        onChange={(e) => updateDetalle(idx, 'cantidad', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Costo por presentación</label>
                      <NumericFormat
                        value={d.precio_compra_presentacion ?? (d.presentacion_compra === 'CAJA' ? (Number(d.precio_compra_caja || 0) || Number(d.precio || 0) * Number(d.cant_p_caja || 1)) : d.presentacion_compra === 'PACK' ? Number(d.precio || 0) * Number(d.cant_p_pack || 1) : d.precio)}
                        thousandSeparator="."
                        decimalSeparator="," 
                        decimalScale={0}
                        allowNegative={false}
                        onValueChange={(values) => updateDetalle(idx, 'precio_compra_presentacion', values.value)}
                        className="w-full rounded-md border border-green-300 bg-white px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                        prefix="₲ "
                      />
                    </div>

                    {/* Cantidad por Caja (solo para CAJA) */}
                    {d.unidad_medida === 'CAJA' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unid. x Caja
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={d.cant_p_caja}
                          onChange={(e) => updateDetalle(idx, 'cant_p_caja', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-orange-300 dark:border-orange-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50 dark:bg-orange-900/30 dark:text-gray-100"
                        />
                      </div>
                    )}

                    {/* Fecha de Vencimiento */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <FaCalendarAlt size={12} />
                        Fecha Venc.
                      </label>
                      <input
                        type="date"
                        value={d.fecha_vencimiento || ''}
                        onChange={(e) => updateDetalle(idx, 'fecha_vencimiento', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Precio Compra Unitario */}
                 
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <FaDollarSign size={12} />
                          Precio Compra {d.unidad_medida === 'CAJA' ? '(Unit.)' : ''}
                        </label>
                      
                      </div>
                      <NumericFormat
                        value={
                          d.unidad_medida === 'CAJA'
                            ? parseFloat(d.precio_compra_caja || '0') / parseFloat(d.cant_p_caja || '1')
                            : (d.lote_pr_compr_rec || d.precio_compra || d.precio)
                        }
                        thousandSeparator="."
                        decimalSeparator=","
                        disabled={d.unidad_medida === 'CAJA' || !d.precio_confirmado}
                        decimalScale={0}
                        fixedDecimalScale={false}
                        allowNegative={false}
                        onValueChange={(values) => updateDetalle(idx, 'precio', values.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${d.unidad_medida === 'CAJA'
                          ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed border-gray-300 dark:border-gray-500 dark:text-gray-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100'
                          }`}
                        prefix="₲ "
                        placeholder="0"
                      />
                    </div>
                      {d.unidad_medida !== 'CAJA' && (
                          <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={!!d.precio_confirmado}
                              onChange={() => handleToggleModificarPrecio(idx, 'precio')}
                            />
                            Modificar Precio Compra
                          </label>
                        )}
               

                    {/* Precio Compra por Caja (solo para CAJA) */}
                    {d.unidad_medida === 'CAJA' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <FaDollarSign size={12} />
                            Precio Compra (Caja)
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={!!d.precio_compra_caja_confirmado}
                              onChange={() => handleToggleModificarPrecio(idx, 'precio_compra_caja')}
                            />
                            Modificar Precio Compra
                          </label>
                        </div>
                        <NumericFormat
                          value={d.precio_compra_caja}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={0}
                          fixedDecimalScale={false}
                          allowNegative={false}
                          onValueChange={(values) => updateDetalle(idx, 'precio_compra_caja', values.value)}
                          disabled={!d.precio_compra_caja_confirmado}
                          className={`w-full px-3 py-2 text-sm border border-orange-300 dark:border-orange-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${d.precio_compra_caja_confirmado ? 'bg-orange-50 dark:bg-orange-900/30 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed border-gray-300 dark:border-gray-500 dark:text-gray-300'}`}
                          prefix="₲ "
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer del Card - Subtotal */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-400">
                      ₲ {calcularSubtotal(d).toLocaleString('es-PY')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {nuevosAbierto !== null && detalles[nuevosAbierto] && (
        <ModalAtributosNuevos
          isOpen
          nombre={detalles[nuevosAbierto].nombre_producto}
          unidades={unidadesQueEntran(detalles[nuevosAbierto])}
          inicial={detalles[nuevosAbierto].atributos_nuevos}
          onClose={() => setNuevosAbierto(null)}
          onConfirm={(lista: AtributoNuevo[]) => {
            setDetalles(detalles.map((x, i) => (i === nuevosAbierto ? { ...x, atributos_nuevos: lista.length ? lista : null } : x)));
            setNuevosAbierto(null);
          }}
        />
      )}
      {repartoAbierto !== null && detalles[repartoAbierto] && (
        <ModalRepartoAtributos
          isOpen
          modo="compra"
          nombre={detalles[repartoAbierto].nombre_producto}
          unidades={unidadesQueEntran(detalles[repartoAbierto])}
          atributos={atributosPorProducto[Number(detalles[repartoAbierto].idproducto)] || []}
          inicial={detalles[repartoAbierto].atributos}
          onClose={() => setRepartoAbierto(null)}
          onConfirm={(reparto: RepartoItem[]) => {
            setDetalles(detalles.map((x, i) => (i === repartoAbierto ? { ...x, atributos: reparto } : x)));
            setRepartoAbierto(null);
          }}
        />
      )}
      <ModalAdvert
        isOpen={modalAdvertOpen}
        onClose={() => {
          setModalAdvertOpen(false);
          setPendingChange(null);
        }}
        onConfirm={() => {
          if (pendingChange) {
            const updated = [...detalles];
            const { index, field } = pendingChange;
            const confirmedField = field === 'precio' ? 'precio_confirmado' : 'precio_compra_caja_confirmado';
            updated[index][confirmedField] = true;
            updated[index].numero_lote = incrementarLote(updated[index].numero_lote);
            setDetalles(updated);
          }
          setModalAdvertOpen(false);
          setPendingChange(null);
        }}
        confirmButtonText="Cambiar igual"
        message="Si quieres cambiar el precio de compra debes agregar otro numero de lote para no mezclar productos ya comprados."
      />
    </div>
  );
};

export default DetallesProductos;
