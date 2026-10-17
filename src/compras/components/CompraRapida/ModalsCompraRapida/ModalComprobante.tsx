'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ModalComprobanteProps {
  isOpen: boolean;
  onClose: () => void;
  datos: {
    nro_factura: string;
    fecha: string;
    cantidadProductos: number;
  };
  productos: any[];
  avisoFotos?: string;
  isVenta?: boolean;
  tipoDescuento?: string;
  montoTotalDescuento?: string;
  montoTotalRecargo?: string;
  totalFinalVenta?: number;
  onGenerarComprobante?: () => Promise<void>;
  onGenerarPagare?: () => Promise<void>;
  mostrarPagare?: boolean;
  progresoComprobante?: { porcentaje: number; mensaje: string; segundos: number } | null;
}

const ModalComprobante = ({
  isOpen,
  onClose,
  datos,
  productos,
  avisoFotos,
  isVenta = false,
  tipoDescuento,
  montoTotalDescuento,
  montoTotalRecargo,
  totalFinalVenta,
  onGenerarComprobante,
  onGenerarPagare,
  mostrarPagare = false,
  progresoComprobante
}: ModalComprobanteProps) => {
  const [generandoComprobante, setGenerandoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState('');

  useEffect(() => {
    console.log("Datos del producto", productos);
  }, [productos]);

  // Compra: la cantidad es de la presentacion elegida (cajas/packs/unidades) y el costo se toma por presentacion.
  const presentacionCompra = (p: any) => (!isVenta && p.presentacion_compra) || null;
  const costoCompra = (p: any) => {
    const pres = presentacionCompra(p);
    if (!pres) return Number(p.precio_compra) || 0;
    const unit = Number(p.precio_compra ?? p.precio) || 0;
    return Number(p.precio_compra_presentacion) || (pres === 'CAJA' ? (Number(p.precio_compra_caja) || unit * (Number(p.cant_p_caja) || 1)) : pres === 'PACK' ? unit * (Number(p.cant_p_pack) || 1) : unit);
  };
  const cantidadCompraTexto = (p: any) => {
    const pres = presentacionCompra(p);
    const n = Number(p.cantidad) || 0;
    if (pres === 'CAJA') return `${n} ${n === 1 ? 'caja' : 'cajas'}`;
    if (pres === 'PACK') return `${n} ${n === 1 ? 'pack' : 'packs'}`;
    return String(n);
  };
  // En Venta se calcula segun caja/pack/unidad.
  const calcularSubtotalBase = (p: any) => {
    if (!isVenta) return costoCompra(p) * (Number(p.cantidad) || 0);
    if (p.unidad_medida === "CAJA" || Number(p.cant_p_pack) > 0) return (Number(p.cant_cajas_vender) || 0) * (Number(p.precio_venta_caja) || 0) + (Number(p.cant_packs_vender) || 0) * (Number(p.precio_venta_pack) || 0) + (Number(p.cant_unidades_sueltas) || 0) * (Number(p.precio_venta) || 0);
    return (Number(p.cantidad) || 0) * (Number(p.precio_venta) || 0);
  };
  const totalCompra = productos.reduce((acc, p) => acc + calcularSubtotalBase(p), 0);
  const totalFinalCalculado = tipoDescuento === "descuento_total" ? totalCompra - (Number(montoTotalDescuento) || 0) : tipoDescuento === "recargo_total" ? totalCompra + (Number(montoTotalRecargo) || 0) : productos.reduce((acc, p) => acc + calcularSubtotalBase(p) - (tipoDescuento === "descuento_producto" ? Number(p.descuento) || 0 : 0) + (tipoDescuento === "recargo_producto" ? Number(p.recargo) || 0 : 0), 0);
  const totalFinal = isVenta && totalFinalVenta !== undefined ? totalFinalVenta : totalFinalCalculado;
  const esAjusteProducto = tipoDescuento === "descuento_producto" || tipoDescuento === "recargo_producto";
  const importeAjusteProducto = (p: any) => tipoDescuento === "recargo_producto" ? Number(p.recargo) || 0 : Number(p.descuento) || 0;

  const getColSpan = () => {
    if (esAjusteProducto) {
      return 6; // Producto, Cantidad, Precio, Descuento, Total sin Descuento, Total con Descuento
    }
    return 4; // Producto, Cantidad, Precio, Total
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-opacity-30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircleIcon className="h-8 w-8" />
              <Dialog.Title as="h3" className="text-lg font-semibold leading-6">
                {`${isVenta ? "Venta realizada exitosamente" : "Compra registrada exitosamente"}`}
              </Dialog.Title>
            </div>

            <div className="mt-6 text-gray-700 text-sm space-y-2">
              {avisoFotos && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-medium text-amber-800">{avisoFotos}</p>}
              <p><strong>Nro Factura:</strong> {datos.nro_factura}</p>
              <p><strong>Fecha:</strong> {datos.fecha}</p>
              <p><strong>Cantidad de Productos:</strong> {datos.cantidadProductos}</p>
            </div>

            {/* Tabla de Productos */}
            <div className="mt-6 overflow-x-auto max-h-64 rounded-lg border border-gray-200">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-700">Producto</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">Cantidad</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">
                      {`${!isVenta ? "Precio Compra" : "Precio Venta"}`}
                    </th>

                    {/* Columnas condicionales para descuento por producto */}
                    {esAjusteProducto && (
                      <th className="px-6 py-3 font-semibold text-gray-700">{tipoDescuento === "recargo_producto" ? "Recargo" : "Descuento"}</th>
                    )}

                    <th className="px-6 py-3 font-semibold text-gray-700">
                      {tipoDescuento === "descuento_producto" || tipoDescuento === "recargo_producto" ? "Subtotal" : "Total"}
                    </th>

                    {esAjusteProducto && (
                      <th className="px-6 py-3 font-semibold text-gray-700">Total ajustado</th>
                    )}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan={getColSpan()} className="px-6 py-4 text-center text-gray-500">
                        No hay productos cargados
                      </td>
                    </tr>
                  ) : (
                    productos.map((p, index) => {
                      const priceFinally = isVenta ? p.precio_venta : costoCompra(p);
                      const precio = parseFloat(priceFinally) || 0;
                      const cantidad = parseFloat(p.cantidad) || 0;
                      const ajuste = importeAjusteProducto(p);
                      const totalSinDescuento = calcularSubtotalBase(p);
                      const totalConDescuento = totalSinDescuento - (tipoDescuento === "descuento_producto" ? ajuste : 0) + (tipoDescuento === "recargo_producto" ? ajuste : 0);
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4">{p.nombre_producto}</td>
                          <td className="px-6 py-4">{isVenta ? cantidad : cantidadCompraTexto(p)}</td>
                          <td className="px-6 py-4">{precio.toLocaleString("es-PY")} Gs</td>

                          {/* Mostrar descuento solo si es descuento por producto */}
                          {esAjusteProducto && (
                            <td className="px-6 py-4">{ajuste.toLocaleString("es-PY")} Gs</td>
                          )}

                          {/* Total sin descuento o total normal */}
                          <td className="px-6 py-4">{totalSinDescuento.toLocaleString("es-PY")} Gs</td>

                          {/* Total con descuento solo si es descuento por producto */}
                          {esAjusteProducto && (
                            <td className="px-6 py-4 font-semibold">{totalConDescuento.toLocaleString("es-PY")} Gs</td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Total General */}
            <div className="mt-4 text-right pr-4 space-y-2">
              {tipoDescuento === "descuento_total" && montoTotalDescuento ? (
                <>
                  <div className="text-lg font-semibold text-gray-800">Subtotal: {totalCompra.toLocaleString('es-PY')} Gs</div>
                  <div className="text-lg font-semibold text-red-600">Descuento: -{Number(montoTotalDescuento).toLocaleString('es-PY')} Gs</div>
                  <div className="text-xl font-bold text-green-600 border-t pt-2">Total con descuento: {totalFinal.toLocaleString('es-PY')} Gs</div>
                </>
              ) : tipoDescuento === "recargo_total" && montoTotalRecargo ? (
                <>
                  <div className="text-lg font-semibold text-gray-800">Subtotal: {totalCompra.toLocaleString('es-PY')} Gs</div>
                  <div className="text-lg font-semibold text-blue-600">Recargo: +{Number(montoTotalRecargo).toLocaleString('es-PY')} Gs</div>
                  <div className="text-xl font-bold text-green-600 border-t pt-2">Total con recargo: {totalFinal.toLocaleString('es-PY')} Gs</div>
                </>
              ) : (
                <div className="text-lg font-semibold text-gray-800">Total: {totalFinal.toLocaleString('es-PY')} Gs</div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {isVenta && onGenerarComprobante && (
                <button
                  type="button"
                  className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={generandoComprobante}
                  onClick={async () => {
                    setErrorComprobante('');
                    setGenerandoComprobante(true);
                    try {
                      await onGenerarComprobante();
                    } catch (error) {
                      console.error('No se pudo generar el comprobante PDF:', error);
                      setErrorComprobante(error instanceof Error ? error.message : 'No se pudo generar el comprobante PDF.');
                    } finally {
                      setGenerandoComprobante(false);
                    }
                  }}
                >
                  {generandoComprobante ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Generando comprobante…</span> : 'Ver o descargar PDF'}
                </button>
              )}
              {isVenta && mostrarPagare && onGenerarPagare && <button type="button" className="rounded bg-slate-700 px-5 py-2 text-white hover:bg-slate-800 disabled:opacity-60" disabled={generandoComprobante} onClick={async () => { setErrorComprobante(''); setGenerandoComprobante(true); try { await onGenerarPagare(); } catch (error) { setErrorComprobante(error instanceof Error ? error.message : 'No se pudo generar el pagaré PDF.'); } finally { setGenerandoComprobante(false); } }}>{generandoComprobante ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Generando pagaré…</span> : 'Generar pagaré'}</button>}
              <button
                type="button"
                className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
            {errorComprobante && <p role="alert" className="mt-3 text-right text-sm text-red-600">{errorComprobante}</p>}
            {generandoComprobante && progresoComprobante && <div className="mt-3" role="status"><div className="mb-1 flex justify-between text-xs text-gray-600"><span>{progresoComprobante.mensaje} (avance aproximado)</span><span>{progresoComprobante.porcentaje}% · {progresoComprobante.segundos}s</span></div><div className="h-2 overflow-hidden rounded bg-gray-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${progresoComprobante.porcentaje}%` }} /></div></div>}
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalComprobante;
