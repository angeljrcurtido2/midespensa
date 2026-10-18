import { Fragment, useState, type FC } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaTrash, FaTag, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { textoReparto, sumaReparto } from '../../../components/ModalRepartoAtributos';
import AyudaPrecioUnidad from '../../../components/AyudaPrecioUnidad';
import OfertaCantidad from '../../../components/OfertaCantidad';
import type { TipoAjusteVenta } from './TipoDescuento';

interface Props {
  detalles: any[];
  tipoDescuento: TipoAjusteVenta;
  updateDetalle: (i: number, campo: string, valor: string | number) => void;
  removeDetalle: (i: number) => void;
  openModalAtributo: (i: number) => void;
  productosConDetalles: { [key: number]: boolean };
  atributosPorProducto: { [key: number]: any[] };
  calcularSubtotal: (d: any) => number;
  /** Botón "Aplicar promo" de cada presentación (lo provee DetallesProductos). */
  renderPromo: (d: any, i: number, presentacion: 'unidad' | 'caja' | 'pack') => React.ReactNode;
  showAdvert: (mensaje: string) => void;
}

const gs = (n: number) => `${Math.round(n).toLocaleString('es-PY')}`;
const esDecimal = (u: string) => ['KG', 'L', 'LITRO', 'METROS', 'M'].includes(String(u || '').toUpperCase());
const CAMPO = 'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

/**
 * Líneas de la venta en forma de tabla (como en un sistema de escritorio): una fila por producto con cantidad,
 * precio y subtotal a la vista, y los datos poco usados (vencimiento, promo, oferta) en un desplegable de la fila.
 */
const LineasVentaTabla: FC<Props> = ({ detalles, tipoDescuento, updateDetalle, removeDetalle, openModalAtributo, productosConDetalles, atributosPorProducto, calcularSubtotal, renderPromo, showAdvert }) => {
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set());
  const alternar = (i: number) =>
    setAbiertas((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const conAjuste = tipoDescuento === 'descuento_producto' || tipoDescuento === 'recargo_producto';

  return (
    <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <table className="lineas-venta w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th scope="col" className="w-10 px-3 py-2.5 text-left">#</th>
            <th scope="col" className="px-3 py-2.5 text-left">Producto</th>
            <th scope="col" className="px-3 py-2.5 text-left">Cantidad</th>
            <th scope="col" className="px-3 py-2.5 text-left">Precio (Gs.)</th>
            {conAjuste && <th scope="col" className="px-3 py-2.5 text-left">{tipoDescuento === 'recargo_producto' ? 'Recargo' : 'Descuento'}</th>}
            <th scope="col" className="px-3 py-2.5 text-right">Subtotal</th>
            <th scope="col" className="w-28 px-3 py-2.5 text-right"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {detalles.map((d, i) => {
            const caja = d.unidad_medida === 'CAJA';
            const conPack = Number(d.cant_p_pack) > 0;
            const multiple = caja || conPack;
            const tieneAtributos = !!productosConDetalles[d.idproducto];
            const repartido = sumaReparto(d.atributos) === Number(d.cantidad) && Number(d.cantidad) > 0;
            const abierta = abiertas.has(i);
            const colspan = conAjuste ? 7 : 6;
            return (
              <Fragment key={i}>
                <tr className="align-top hover:bg-blue-50/40 dark:hover:bg-slate-800/60">
                  <td className="px-3 py-3 text-slate-400" data-numero>{i + 1}</td>
                  <td className="px-3 py-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{d.nombre_producto}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {String(d.unidad_medida || '').toUpperCase() === 'KG' ? 'Kilogramo' : d.unidad_medida}
                      {d.numero_lote ? ` · Lote ${d.numero_lote}` : ''}
                      {multiple && ` · ${d.cantidad || 0} unidades en total`}
                    </p>
                    {tieneAtributos && (
                      <button
                        type="button"
                        onClick={() => openModalAtributo(i)}
                        className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${repartido ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                      >
                        <FaTag size={10} />
                        {repartido ? `Repartido (${textoReparto(d.atributos, atributosPorProducto[d.idproducto] || [])})` : 'Repartir por color / sabor'}
                      </button>
                    )}
                  </td>

                  <td className="px-3 py-3" data-etiqueta="Cantidad">
                    {multiple ? (
                      <div className="grid w-[210px] grid-cols-3 gap-1.5">
                        {caja ? (
                          <label className="text-[11px] font-semibold text-slate-500">Cajas
                            <input type="number" min="0" step="1" value={d.cant_cajas_vender || 0} onChange={(e) => updateDetalle(i, 'cant_cajas_vender', e.target.value)} className={CAMPO} />
                          </label>
                        ) : <span />}
                        {conPack ? (
                          <label className="text-[11px] font-semibold text-slate-500">Packs
                            <input type="number" min="0" step="1" value={d.cant_packs_vender || 0} onChange={(e) => updateDetalle(i, 'cant_packs_vender', e.target.value)} className={CAMPO} />
                          </label>
                        ) : <span />}
                        <label className="text-[11px] font-semibold text-slate-500">Sueltas
                          <input
                            type="number" min="0" step="1" value={d.cant_unidades_sueltas || 0}
                            onChange={(e) => updateDetalle(i, 'cant_unidades_sueltas', e.target.value)}
                            onBlur={(e) => {
                              if (!caja) return;
                              const valor = parseInt(e.target.value) || 0;
                              if (valor >= parseInt(d.cant_p_caja)) {
                                showAdvert(`Las unidades sueltas no pueden ser igual o mayor a ${d.cant_p_caja}. Si necesitás más, agregá otra caja completa.`);
                                updateDetalle(i, 'cant_unidades_sueltas', String(parseInt(d.cant_p_caja) - 1));
                              }
                            }}
                            className={CAMPO}
                          />
                        </label>
                      </div>
                    ) : (
                      <input
                        type="number"
                        aria-label={`Cantidad de ${d.nombre_producto}`}
                        min={esDecimal(d.unidad_medida) ? 0.001 : 1}
                        step={esDecimal(d.unidad_medida) ? 0.001 : 1}
                        max={d.cantidadMaximo}
                        value={d.cantidad}
                        onChange={(e) => updateDetalle(i, 'cantidad', e.target.value)}
                        onBlur={(e) => {
                          const dec = esDecimal(d.unidad_medida);
                          let valor = dec ? parseFloat(e.target.value) : parseInt(e.target.value);
                          const min = dec ? 0.001 : 1;
                          const max = parseFloat(d.cantidadMaximo);
                          if (isNaN(valor)) { showAdvert(`Ingresá una cantidad válida (mínimo ${min})`); valor = min; }
                          if (valor < min) { showAdvert(`La cantidad mínima permitida es ${min}`); valor = min; }
                          if (valor > max) { showAdvert(`La cantidad no puede superar el stock disponible (${max})`); valor = max; }
                          updateDetalle(i, 'cantidad', valor);
                        }}
                        className={`${CAMPO} w-28 text-right`}
                      />
                    )}
                  </td>

                  <td className="px-3 py-3" data-etiqueta="Precio (Gs.)">
                    <div className="flex w-[210px] flex-col gap-1.5">
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span className="w-10">{multiple ? 'Unid.' : ''}</span>
                        <NumericFormat value={d.precio_venta} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} aria-label={`Precio de ${d.nombre_producto}`} onValueChange={(v) => updateDetalle(i, 'precio_venta', v.floatValue || 0)} className={`${CAMPO} text-right`} />
                      </label>
                      {caja && (
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span className="w-10">Caja</span>
                          <NumericFormat value={d.precio_venta_caja} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} onValueChange={(v) => updateDetalle(i, 'precio_venta_caja', v.floatValue || 0)} className={`${CAMPO} text-right`} />
                        </label>
                      )}
                      {conPack && (
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span className="w-16">Pack/blíster</span>
                          <NumericFormat value={d.precio_venta_pack} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} onValueChange={(v) => updateDetalle(i, 'precio_venta_pack', v.floatValue || 0)} className={`${CAMPO} text-right`} />
                        </label>
                      )}
                    </div>
                  </td>

                  {conAjuste && (
                    <td className="px-3 py-3" data-etiqueta={tipoDescuento === 'recargo_producto' ? 'Recargo' : 'Descuento'}>
                      <NumericFormat
                        value={tipoDescuento === 'recargo_producto' ? d.recargo : d.descuento}
                        thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false}
                        aria-label={tipoDescuento === 'recargo_producto' ? 'Recargo de la línea' : 'Descuento de la línea'}
                        onValueChange={(v) => updateDetalle(i, tipoDescuento === 'recargo_producto' ? 'recargo' : 'descuento', v.floatValue || 0)}
                        className={`${CAMPO} w-28 text-right`}
                      />
                    </td>
                  )}

                  <td className="px-3 py-3 text-right text-base font-extrabold text-emerald-700 dark:text-emerald-400" data-etiqueta="Subtotal">{gs(calcularSubtotal(d))}</td>

                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => alternar(i)} aria-expanded={abierta} aria-label={`Más datos de ${d.nombre_producto}`} title="Vencimiento, promo y oferta" className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                        {abierta ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                      </button>
                      <button type="button" onClick={() => removeDetalle(i)} aria-label={`Quitar ${d.nombre_producto}`} title="Quitar de la venta" className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/30">
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
                {(abierta || Number(d.oferta_cantidad) > 0) && (
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <td />
                    <td colSpan={colspan - 1} className="px-3 pb-3">
                      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
                        <OfertaCantidad d={d} />
                        {abierta && (
                          <>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fecha de vencimiento
                              <input type="date" value={d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toISOString().split('T')[0] : ''} onChange={(e) => updateDetalle(i, 'fecha_vencimiento', e.target.value)} className={`${CAMPO} mt-1 w-44`} />
                            </label>
                            <div className="flex flex-wrap gap-3">
                              {renderPromo(d, i, 'unidad')}
                              {caja && renderPromo(d, i, 'caja')}
                              {conPack && renderPromo(d, i, 'pack')}
                            </div>
                            {caja && <AyudaPrecioUnidad precio={d.precio_venta_caja} unidades={d.cant_p_caja} precioSuelta={d.precio_venta} />}
                            {conPack && <AyudaPrecioUnidad precio={d.precio_venta_pack} unidades={d.cant_p_pack} precioSuelta={d.precio_venta} />}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LineasVentaTabla;
