import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ModalDetalleVenta from '../../components/ModalsVenta/ModalDetalleVenta';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';

export default function DetalleVentaPage() {
  const { id } = useParams();
  const cerrar = useCerrarVentana();
  const [venta, setVenta] = useState<any>(null);
  useEffect(() => {
    try {
      const value = sessionStorage.getItem('venta-detalle-actual');
      const parsed = value ? JSON.parse(value) : null;
      if (parsed && String(parsed.idventa) === String(id)) setVenta(parsed);
    } catch { setVenta(null); }
  }, [id]);
  if (!venta) return <div className="p-8 text-slate-600">No se encontraron los datos de esta venta. Volvé al listado y abrí el detalle nuevamente.</div>;
  return <ModalDetalleVenta isOpen venta={venta} ventana onClose={() => cerrar('/ventas')} />;
}


