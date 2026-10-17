import { useEffect, useState, type FC } from 'react';
import ModalAdvert from '../../../components/ModalAdvert';
import { NumericFormat } from 'react-number-format';
import { FaBox, FaBoxOpen, FaTrash, FaTag, FaHashtag, FaDollarSign, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import ModalRepartoAtributos, { textoReparto, sumaReparto, type RepartoItem } from '../../../components/ModalRepartoAtributos';
import { getDetalles } from '../../../services/productoDetalle';
import type { DetalleProductoResponse } from '../../../services/productoDetalle';
import type { TipoAjusteVenta } from './TipoDescuento';
import AyudaPrecioUnidad from '../../../components/AyudaPrecioUnidad';
import OfertaCantidad from '../../../components/OfertaCantidad';
import { descuentoOfertaDe } from '../../../utils/oferta';
import LineasVentaTabla from './LineasVentaTabla';

interface Props {
  /** En pantalla completa: sin tope de alto y con las líneas en columnas. */
  pagina?: boolean;
  detalles: any[];
  setDetalles: (data: any[]) => void;
  setCantidadProducto?: (cantidad: number) => void;
  tipoDescuento: TipoAjusteVenta;
}

/** Botón opcional "Aplicar precio promo" de una presentación (unidad, caja o pack) de la línea de venta. */
const BotonPromo = ({ d, idx, presentacion, updateDetalle }: { d: any; idx: number; presentacion: 'unidad' | 'caja' | 'pack'; updateDetalle: (i: number, f: string, v: number) => void }) => {
  const promo = Number(d[`promo_${presentacion}`]);
  if (!(promo > 0)) return null;
  const campo = presentacion === 'unidad' ? 'precio_venta' : `precio_venta_${presentacion}`;
  const normal = Number(d[`promo_normal_${presentacion}`]) || 0;
  const aplicada = Number(d[campo]) === promo;
  const gs = (n: number) => `₲ ${n.toLocaleString('es-PY')}`;
  return (
    <button
      type="button"
      data-testid={`promo-${presentacion}`}
      onClick={() => updateDetalle(idx, campo, aplicada ? normal : promo)}
      title={aplicada ? `Volver al precio normal ${gs(normal)}` : `Aplicar precio promo ${gs(promo)}${d.promo_titulo ? ' · ' + d.promo_titulo : ''}`}
      className={`mt-1 w-full rounded-md border px-1 py-1 text-[11px] leading-tight font-semibold transition ${aplicada ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
    >
      {aplicada ? <>✓ Promo aplicada<br />quitar</> : <>Aplicar promo<br />{gs(promo)}</>}
    </button>
  );
};

const DetallesProductos: FC<Props> = ({ detalles, setDetalles, tipoDescuento, pagina = false }) => {
  const [advertMessage, setAdvertMessage] = useState<string>('');
  const [advertOpen, setAdvertOpen] = useState<boolean>(false);
  const [modalAtributoOpen, setModalAtributoOpen] = useState<boolean>(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [productosConDetalles, setProductosConDetalles] = useState<{ [key: number]: boolean }>({});
  const [atributosPorProducto, setAtributosPorProducto] = useState<{ [key: number]: DetalleProductoResponse[] }>({});

  const updateDetalle = (index: number, field: string, value: string | number) => {
    const updated = [...detalles];
    const detalleActual = updated[index];
    const cantidadMaxima = detalleActual.cantidadMaximo || Infinity;

    // Actualizar el campo
    updated[index][field] = value;

    //   Para productos CAJA: calcular total de unidades automáticamente
    if (updated[index].unidad_medida === 'CAJA' || Number(updated[index].cant_p_pack) > 0) {
      const cajasVender = parseFloat(updated[index].cant_cajas_vender || '0');
      const unidadesSueltas = parseFloat(updated[index].cant_unidades_sueltas || '0');
      const cantPorCaja = updated[index].unidad_medida === 'CAJA' ? parseFloat(updated[index].cant_p_caja || '0') : 0;
      const packs = parseFloat(updated[index].cant_packs_vender || '0');
      const cantPorPack = parseFloat(updated[index].cant_p_pack || '0');

      // Calcular cantidad total de unidades
      const totalUnidades = (cajasVender * cantPorCaja) + (packs * cantPorPack) + unidadesSueltas;

      // Validar que no exceda el stock máximo disponible
      if (totalUnidades > cantidadMaxima && cantidadMaxima !== Infinity) {
        showAdvert(`  Stock insuficiente. Máximo disponible: ${cantidadMaxima} unidades (${Math.floor(cantidadMaxima / cantPorCaja)} cajas completas)`);

        // Revertir al valor anterior
        if (field === 'cant_cajas_vender') {
          const cajasMaximas = Math.floor(cantidadMaxima / cantPorCaja);
          updated[index].cant_cajas_vender = cajasMaximas;
          updated[index].cantidad = cajasMaximas * cantPorCaja;
        } else if (field === 'cant_unidades_sueltas') {
          updated[index].cant_unidades_sueltas = 0;
          updated[index].cantidad = cajasVender * cantPorCaja;
        } else if (field === 'cant_packs_vender') {
          const maxPacks = cantPorPack > 0 ? Math.floor(Math.max(cantidadMaxima - cajasVender * cantPorCaja - unidadesSueltas, 0) / cantPorPack) : 0;
          updated[index].cant_packs_vender = maxPacks;
          updated[index].cantidad = (cajasVender * cantPorCaja) + (maxPacks * cantPorPack) + unidadesSueltas;
        }
        setDetalles(updated);
        return;
      }

      updated[index].cantidad = totalUnidades;
    } else {
      // Para productos NO CAJA: validar cantidad directamente
      if (field === 'cantidad') {
        const cantidadIngresada = parseFloat(value.toString());

        if (cantidadIngresada > cantidadMaxima && cantidadMaxima !== Infinity) {
          showAdvert(`  Stock insuficiente. Máximo disponible: ${cantidadMaxima} unidades`);
          updated[index].cantidad = cantidadMaxima;
          setDetalles(updated);
          return;
        }
      }
    }

    setDetalles(updated);
  };

  const confirmarReparto = (index: number, reparto: RepartoItem[]) => {
    const updated = [...detalles];
    updated[index].atributos = reparto;
    updated[index].detalle_producto = null;
    setDetalles(updated);
    closeModalAtributo();
  };

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const openModalAtributo = (index: number) => {
    setSelectedProductIndex(index);
    setModalAtributoOpen(true);
  };

  const closeModalAtributo = () => {
    setModalAtributoOpen(false);
    setSelectedProductIndex(null);
  };

  // Verificar qué productos tienen detalles
  useEffect(() => {
    const checkDetalles = async () => {
      const detallesMap: { [key: number]: boolean } = {};
      const listas: { [key: number]: DetalleProductoResponse[] } = {};

      for (const detalle of detalles) {
        if (detalle.idproducto && !detallesMap[detalle.idproducto]) {
          try {
            const response = await getDetalles(detalle.idproducto);
            detallesMap[detalle.idproducto] = response.detalles && response.detalles.length > 0;
            listas[detalle.idproducto] = response.detalles || [];
          } catch (error) {
            detallesMap[detalle.idproducto] = false;
          }
        }
      }

      setProductosConDetalles(detallesMap);
      setAtributosPorProducto(listas);
    };

    if (detalles.length > 0) {
      checkDetalles();
    }
  }, [detalles.map(d => d.idproducto).join(',')]);

  useEffect(() => {
    if (tipoDescuento !== 'descuento_producto' && tipoDescuento !== 'recargo_producto') {
      const detallesActualizados = detalles.map(detalle => ({
        ...detalle,
        descuento: 0,
        recargo: 0
      }));
      setDetalles(detallesActualizados);
    } else if (tipoDescuento === 'descuento_producto') {
      setDetalles(detalles.map(detalle => ({ ...detalle, recargo: 0 })));
    } else if (tipoDescuento === 'recargo_producto') {
      setDetalles(detalles.map(detalle => ({ ...detalle, descuento: 0 })));
    }
  }, [tipoDescuento]);

  const showAdvert = (message: string) => {
    setAdvertMessage(message);
    setAdvertOpen(true);
  };

  //   Función para calcular el subtotal
  const calcularSubtotal = (d: any) => {
    if (d.unidad_medida === 'CAJA' || Number(d.cant_p_pack) > 0) {
      const cajasVender = parseFloat(d.cant_cajas_vender || '0');
      const unidadesSueltas = parseFloat(d.cant_unidades_sueltas || '0');
      const precioVentaCaja = parseFloat(d.precio_venta_caja || '0');
      const precioVentaUnitario = parseFloat(d.precio_venta || '0');
      const descuento = parseFloat(d.descuento || '0');
      const recargo = parseFloat(d.recargo || '0');

      const subtotal = (cajasVender * precioVentaCaja) + (parseFloat(d.cant_packs_vender || '0') * parseFloat(d.precio_venta_pack || '0')) + (unidadesSueltas * precioVentaUnitario) - descuento + recargo - descuentoOfertaDe(d);
      return subtotal;
    } else {
      const cantidad = parseFloat(d.cantidad || '0');
      const precioVenta = parseFloat(d.precio_venta || '0');
      const descuento = parseFloat(d.descuento || '0');
      const recargo = parseFloat(d.recargo || '0');

      return (cantidad * precioVenta) - descuento + recargo - descuentoOfertaDe(d);
    }
  };
  return (
    <div className="">
      {pagina && detalles.length > 0 ? (
        <LineasVentaTabla
          detalles={detalles}
          tipoDescuento={tipoDescuento}
          updateDetalle={updateDetalle}
          removeDetalle={removeDetalle}
          openModalAtributo={openModalAtributo}
          productosConDetalles={productosConDetalles}
          atributosPorProducto={atributosPorProducto}
          calcularSubtotal={calcularSubtotal}
          renderPromo={(d, i, presentacion) => <BotonPromo d={d} idx={i} presentacion={presentacion} updateDetalle={updateDetalle} />}
          showAdvert={showAdvert}
        />
      ) : detalles.length === 0 ? (
        <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-12 border-2 border-blue-200 dark:border-gray-700 shadow-md">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-100 dark:bg-gray-700 p-6 rounded-full">
              <FaExclamationTriangle className="text-blue-500 dark:text-gray-400" size={48} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-700 dark:text-gray-200 mb-2">No hay productos agregados</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400">Utilizá el botón "Seleccionar producto" para agregar productos a la venta</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 dark:bg-gray-800 rounded-t-lg p-3 border-b-2 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 dark:bg-gray-700 p-2 rounded-lg">
                <FaBoxOpen className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Productos Seleccionados
                </h3>
                <div className="flex flex-row gap-3">
                  <p className="text-sm text-white/90 dark:text-gray-300 mt-1">
                    Productos en venta:
                  </p>
                  <span className="bg-white/30 dark:bg-gray-700 px-3 py-0.5 rounded-full text-sm font-bold text-white">
                    {detalles.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenedor de productos */}
          <div className="bg-white dark:bg-gray-900 p-2">
            <div className={pagina ? "grid w-full grid-cols-1 gap-4 2xl:grid-cols-2" : "grid gap-4 w-full max-h-[min(640px,62vh)] overflow-auto pr-2"}>
              {detalles.map((d, idx) => (
                <div
                  key={idx}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${d.unidad_medida === 'CAJA'
                    ? 'border-orange-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-gray-600'
                    : 'border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                    }`}
                >
                  {/* Header */}
                  <div className={`p-4 ${d.unidad_medida === 'CAJA'
                    ? 'bg-orange-500 dark:bg-gray-700'
                    : 'bg-blue-500 dark:bg-gray-700'
                    } text-white`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-white/20 dark:bg-gray-600 p-2 rounded-lg flex-shrink-0">
                          {d.unidad_medida === 'CAJA' ? <FaBox size={20} /> : <FaBoxOpen size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-base truncate">
                            {d.nombre_producto}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-white/20 dark:bg-gray-600">
                              {d.unidad_medida === 'KG' ? 'Kg' : d.unidad_medida === 'L' ? 'L' : d.unidad_medida}
                            </span>
                            <span className={`text-xs font-mono ${d.idlote === -1 ? 'bg-green-500/30 dark:bg-gray-600 px-2 py-0.5 rounded font-semibold' : ''}`}>
                              Lote: {d.numero_lote || 'N/A'}
                              {d.idlote === -1 && <span className="ml-1 text-[10px]">(NUEVO)</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDetalle(idx)}
                        type='button'
                        className="bg-red-500 hover:bg-red-600 dark:bg-gray-600 dark:hover:bg-gray-500 p-2 rounded-lg transition-colors flex-shrink-0"
                        title="Eliminar producto"
                      >
                        <FaTrash className="text-white" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body del Card */}
                  <div className="p-4 w-full overflow-auto">
                    {/* Botón para Seleccionar Atributos */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => openModalAtributo(idx)}
                        disabled={!productosConDetalles[d.idproducto]}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm border-2 rounded-lg transition-all font-semibold ${productosConDetalles[d.idproducto]
                          ? 'bg-purple-50 dark:bg-gray-700 border-purple-300 dark:border-gray-600 hover:bg-purple-100 dark:hover:bg-gray-600 hover:border-purple-400 dark:hover:border-gray-500 text-purple-900 dark:text-gray-200'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <FaTag size={14} className={productosConDetalles[d.idproducto] ? 'text-purple-600 dark:text-gray-400' : 'text-gray-400'} />
                          <span className="font-semibold">
                            {productosConDetalles[d.idproducto] ? 'Repartir por atributo' : 'Sin atributos'}
                            {Array.isArray(d.atributos) && d.atributos.length > 0 && (
                              <span className="ml-2 font-bold text-purple-700 dark:text-gray-300">
                                ({textoReparto(d.atributos, atributosPorProducto[d.idproducto] || [])})
                              </span>
                            )}
                          </span>
                        </div>
                        {productosConDetalles[d.idproducto] && (
                          sumaReparto(d.atributos) === Number(d.cantidad) && Number(d.cantidad) > 0 ? (
                            <span className="bg-purple-600 dark:bg-gray-600 text-white text-xs px-2.5 py-1 rounded-full">✓ Repartido</span>
                          ) : (
                            <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full">Falta repartir</span>
                          )
                        )}
                      </button>
                    </div>

                    {/* Grid de campos - Layout diferente para CAJA vs otros productos */}
                    {d.unidad_medida === 'CAJA' || Number(d.cant_p_pack) > 0 ? (
                      // Layout para productos CAJA
                      <div className="grid grid-cols-2 gap-3">
                        {/* Cajas a Vender */}
                        {d.unidad_medida === 'CAJA' && <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <FaBox size={12} className="text-orange-600 dark:text-gray-400" />
                            Cajas a Vender
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={d.cant_cajas_vender || 0}
                            onChange={(e) => updateDetalle(idx, "cant_cajas_vender", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                        </>}

                        {/* Packs a Vender */}
                        {Number(d.cant_p_pack) > 0 && <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Packs a Vender ({d.cant_p_pack} unid.)</label>
                          <input type="number" min="0" step="1" value={d.cant_packs_vender || 0} onChange={(e) => updateDetalle(idx, 'cant_packs_vender', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md" />
                        </div>}

                        {/* Unidades Sueltas: en productos CAJA (tope = unidades por caja − 1) y en productos con pack (sin tope). */}
                        {(d.unidad_medida === 'CAJA' || Number(d.cant_p_pack) > 0) && <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <FaHashtag size={12} className="text-blue-600 dark:text-gray-400" />
                            Unidades Sueltas
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            max={d.unidad_medida === 'CAJA' ? d.cant_p_caja - 1 : undefined}
                            value={d.cant_unidades_sueltas || 0}
                            onChange={(e) => updateDetalle(idx, "cant_unidades_sueltas", e.target.value)}
                            onBlur={(e) => {
                              if (d.unidad_medida !== 'CAJA') return;
                              const valor = parseInt(e.target.value) || 0;
                              const maxSueltas = parseInt(d.cant_p_caja) - 1;

                              if (valor >= parseInt(d.cant_p_caja)) {
                                showAdvert(`Las unidades sueltas no pueden ser igual o mayor a ${d.cant_p_caja}. Si necesitas más, agrega otra caja completa.`);
                                updateDetalle(idx, "cant_unidades_sueltas", maxSueltas.toString());
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>}

                        {/* Unidades por Caja (info) */}
                        {d.unidad_medida === 'CAJA' && <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Unid. x Caja
                          </label>
                          <div className="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-gray-700 border-2 border-blue-200 dark:border-gray-600 rounded-lg font-bold text-blue-700 dark:text-gray-200 text-center">
                            {d.cant_p_caja}
                          </div>
                        </div>}

                        {/* Total Unidades (calculado) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Total Unidades
                          </label>
                          <div className="w-full px-3 py-2 text-sm bg-green-50 dark:bg-gray-700 border-2 border-green-200 dark:border-gray-600 rounded-lg font-bold text-green-700 dark:text-gray-200 text-center">
                            {d.cantidad || 0}
                          </div>
                        </div>

                        {/* Fecha Vencimiento */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <FaCalendarAlt size={12} className="text-gray-600 dark:text-gray-400" />
                            Fecha Vencimiento
                          </label>
                          <input
                            type="date"
                            value={d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toISOString().split('T')[0] : ''}
                            onChange={e => updateDetalle(idx, 'fecha_vencimiento', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Precio Unitario */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <FaDollarSign size={12} className="text-green-600 dark:text-gray-400" />
                            Precio Unit.
                          </label>
                          <NumericFormat
                            value={d.precio_venta}
                            thousandSeparator="."
                            decimalSeparator=","
                            onValueChange={(v) => updateDetalle(idx, 'precio_venta', v.floatValue || 0)}
                            decimalScale={0}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                            prefix="₲ "
                          />
<BotonPromo d={d} idx={idx} presentacion="unidad" updateDetalle={updateDetalle} />
                        </div>

                        {/* Precio por Caja */}
                        {d.unidad_medida === 'CAJA' && <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <FaDollarSign size={12} className="text-orange-600 dark:text-gray-400" />
                            Precio x Caja
                          </label>
                          <NumericFormat
                            value={d.precio_venta_caja}
                            thousandSeparator="."
                            decimalSeparator=","
                            onValueChange={(v) => updateDetalle(idx, 'precio_venta_caja', v.floatValue || 0)}
                            decimalScale={0}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                            prefix="₲ "
                          />
<AyudaPrecioUnidad precio={d.precio_venta_caja} unidades={d.cant_p_caja} precioSuelta={d.precio_venta} />
<BotonPromo d={d} idx={idx} presentacion="caja" updateDetalle={updateDetalle} />
                        </div>}

                        {Number(d.cant_p_pack) > 0 && <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Precio x Pack / blíster</label>
                          <NumericFormat value={d.precio_venta_pack} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} onValueChange={(v) => updateDetalle(idx, 'precio_venta_pack', v.floatValue || 0)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" prefix="₲ " />
<AyudaPrecioUnidad precio={d.precio_venta_pack} unidades={d.cant_p_pack} precioSuelta={d.precio_venta} />
<BotonPromo d={d} idx={idx} presentacion="pack" updateDetalle={updateDetalle} />
                        </div>}

                        {/* Descuento (condicional) */}
                        {(tipoDescuento === "descuento_producto" || tipoDescuento === "recargo_producto") && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              {tipoDescuento === 'recargo_producto' ? 'Recargo' : 'Descuento'}
                            </label>
                            <NumericFormat
                              value={tipoDescuento === 'recargo_producto' ? d.recargo : d.descuento}
                              thousandSeparator="."
                              decimalSeparator=","
                              decimalScale={0}
                              fixedDecimalScale={false}
                              allowNegative={false}
                              onValueChange={(values) => updateDetalle(idx, tipoDescuento === 'recargo_producto' ? 'recargo' : 'descuento', values.floatValue || 0)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              prefix="₲ "
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Layout para productos NO CAJA (UNIDAD, KG, L)
                      <div>
                        <div className="flex flex-row gap-3">
                          {/* Cantidad */}
                          <div>
                            <label className="block text-xs font-semibold text-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                              <FaHashtag size={12} className="text-blue-600 dark:text-gray-400" />
                              Cantidad
                            </label>
                            <input
                              type="number"
                              // step 0.1 dejaba el <form> en estado :invalid al cargar 0.25 kg
                              // (250 g): el navegador bloqueaba el submit SIN mostrar error y
                              // la venta nunca se enviaba. Con 0.001 se puede vender por gramo.
                              min={["KG", "L", "LITRO", "METROS", "M"].includes(d.unidad_medida?.toUpperCase?.()) || d.unidad_medida === "KG" || d.unidad_medida === "L" || d.unidad_medida === "LITRO" || d.unidad_medida === "METROS" || d.unidad_medida === "M" ? 0.001 : 1}
                              step={["KG", "L", "LITRO", "METROS", "M"].includes(d.unidad_medida?.toUpperCase?.()) || d.unidad_medida === "KG" || d.unidad_medida === "L" || d.unidad_medida === "LITRO" || d.unidad_medida === "METROS" || d.unidad_medida === "M" ? 0.001 : 1}
                              max={d.cantidadMaximo}
                              value={d.cantidad}
                              onChange={(e) => updateDetalle(idx, "cantidad", e.target.value)}
                              onBlur={(e) => {
                                const unidad = (d.unidad_medida || '').toString().toUpperCase();
                                const unidadEsDecimal = unidad === "KG" || unidad === "L" || unidad === "LITRO" || unidad === "METROS" || unidad === "M";
                                let valor = unidadEsDecimal ? parseFloat(e.target.value) : parseInt(e.target.value);
                                const min = unidadEsDecimal ? 0.001 : 1;
                                const max = parseFloat(d.cantidadMaximo);

                                if (isNaN(valor)) {
                                  showAdvert(`Debés ingresar una cantidad válida (mínimo ${min})`);
                                  valor = min;
                                }
                                if (valor < min) {
                                  showAdvert(`La cantidad mínima permitida es ${min}`);
                                  valor = min;
                                }
                                if (valor > max) {
                                  showAdvert(`La cantidad no puede superar el stock disponible (${max})`);
                                  valor = max;
                                }
                                updateDetalle(idx, "cantidad", valor);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Fecha Vencimiento */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                              <FaCalendarAlt size={12} className="text-gray-600 dark:text-gray-400" />
                              Fecha Vencimiento
                            </label>
                            <input
                              type="date"
                              value={d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toISOString().split('T')[0] : ''}
                              onChange={e => updateDetalle(idx, 'fecha_vencimiento', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Precio Venta */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                              <FaDollarSign size={12} className="text-green-600 dark:text-gray-400" />
                              Precio Venta
                            </label>
                            <NumericFormat
                              value={d.precio_venta}
                              thousandSeparator="."
                              decimalSeparator=","
                              onValueChange={(v) => updateDetalle(idx, 'precio_venta', v.floatValue || 0)}
                              decimalScale={0}
                              fixedDecimalScale={false}
                              allowNegative={false}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-300 truncate"
                              prefix="₲ "
                            />
<BotonPromo d={d} idx={idx} presentacion="unidad" updateDetalle={updateDetalle} />
                          </div>


                        </div>
                        {/* Descuento (condicional) */}
                        {(tipoDescuento === "descuento_producto" || tipoDescuento === "recargo_producto") && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              {tipoDescuento === 'recargo_producto' ? 'Recargo' : 'Descuento'}
                            </label>
                            <NumericFormat
                              value={tipoDescuento === 'recargo_producto' ? d.recargo : d.descuento}
                              thousandSeparator="."
                              decimalSeparator=","
                              decimalScale={0}
                              fixedDecimalScale={false}
                              allowNegative={false}
                              onValueChange={(values) => updateDetalle(idx, tipoDescuento === 'recargo_producto' ? 'recargo' : 'descuento', values.floatValue || 0)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              prefix="₲ "
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <OfertaCantidad d={d} />

                    {/* Footer con Subtotal */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subtotal:</span>
                        <span className="text-xl font-bold text-green-600 dark:text-gray-200">
                          ₲ {calcularSubtotal(d).toLocaleString('es-PY')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ModalAdvert
        isOpen={advertOpen}
        onClose={() => setAdvertOpen(false)}
        message={advertMessage}
      />

      {/* Modal para repartir las unidades entre atributos */}
      {selectedProductIndex !== null && detalles[selectedProductIndex] && (
        <ModalRepartoAtributos
          isOpen={modalAtributoOpen}
          onClose={closeModalAtributo}
          nombre={detalles[selectedProductIndex].nombre_producto}
          unidades={Number(detalles[selectedProductIndex].cantidad) || 0}
          atributos={atributosPorProducto[detalles[selectedProductIndex].idproducto] || []}
          modo="venta"
          inicial={detalles[selectedProductIndex].atributos}
          onConfirm={(r) => confirmarReparto(selectedProductIndex, r)}
        />
      )}
    </div>
  );
};

export default DetallesProductos;
