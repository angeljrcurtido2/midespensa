import type { FC } from 'react';

type Presentacion = 'unidad' | 'pack' | 'caja' | 'gramos' | 'mililitros';
type ProductoPresentacion = {
  nombre_producto: string;
  unidad_medida?: string;
  cant_p_pack?: number | string;
  cant_p_caja?: number | string;
  precio_venta?: number | string;
  precio_venta_pack?: number | string;
  precio_venta_caja?: number | string;
};

interface Props {
  producto: ProductoPresentacion | null;
  onClose: () => void;
  onSelect: (presentacion: Presentacion) => void;
}

const ModalPresentacionVenta: FC<Props> = ({ producto, onClose, onSelect }) => {
  if (!producto) return null;
  const unidad = (producto.unidad_medida || '').toUpperCase();
  const esPeso = unidad === 'KG';
  const esVolumen = unidad === 'L' || unidad === 'LITRO';
  const opciones: { tipo: Presentacion; label: string; precio?: number | string; detalle: string; disponible: boolean }[] = [
    { tipo: 'unidad' as const, label: esPeso ? 'Kilogramo' : esVolumen ? 'Litro' : 'Unidad', precio: producto.precio_venta, detalle: esPeso ? 'Venta por kilogramo' : esVolumen ? 'Venta por litro' : 'Una unidad suelta', disponible: true },
    { tipo: 'pack' as const, label: 'Pack / blíster', precio: producto.precio_venta_pack, detalle: `Trae ${producto.cant_p_pack || 0} unidades`, disponible: !esPeso && !esVolumen && Number(producto.cant_p_pack) > 0 && Number(producto.precio_venta_pack) > 0 },
    { tipo: 'caja' as const, label: 'Caja', precio: producto.precio_venta_caja, detalle: `Trae ${producto.cant_p_caja || 0} unidades`, disponible: unidad === 'CAJA' && Number(producto.cant_p_caja) > 0 && Number(producto.precio_venta_caja) > 0 },
    { tipo: 'gramos' as const, label: 'Gramos', detalle: 'Ingresar el peso en gramos', disponible: esPeso },
    { tipo: 'mililitros' as const, label: 'Mililitros', detalle: 'Ingresar el volumen en mililitros', disponible: esVolumen },
  ].filter((opcion) => opcion.disponible);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Elegir presentacion de venta">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">¿Como desea vender?</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{producto.nombre_producto}</p></div>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Cerrar">×</button>
        </div>
        <div className="grid gap-2">
          {opciones.map((opcion) => (
            <button key={opcion.tipo} type="button" onClick={() => onSelect(opcion.tipo)} className="flex items-center justify-between rounded-lg border border-blue-200 p-3 text-left hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700">
              <span><span className="block font-semibold text-gray-900 dark:text-white">{opcion.label}</span><span className="text-xs text-gray-600 dark:text-gray-300">{opcion.detalle}</span></span>
              {opcion.precio !== undefined && <span className="font-bold text-blue-700 dark:text-blue-300">Gs. {Number(opcion.precio || 0).toLocaleString('es-PY')}</span>}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg border px-4 py-2 text-sm">Cancelar</button>
      </div>
    </div>
  );
};

export default ModalPresentacionVenta;