import { useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ListarProductos from '../../productos/components/ListarProductos';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';

/** Catálogo de productos como pantalla propia para Nueva venta: la venta queda abierta en su pestaña. */
function Contenido() {
  const cerrar = useCerrarVentana();
  // Búsqueda inicial (por ejemplo, un código de barras repetido en varios productos); se usa una sola vez.
  const [inicial] = useState(() => { const b = sessionStorage.getItem('catalogo:busqueda') || ''; sessionStorage.removeItem('catalogo:busqueda'); return b; });
  return (
    <ListarProductos
      seleccionEnPagina
      isBuy={false}
      stockVerify
      initialSearch={inicial}
      setCantidadProducto={() => undefined}
      onSelect={(producto) => {
        sessionStorage.setItem('venta:producto-seleccionado', JSON.stringify(producto));
        cerrar('/ventas/nueva');
      }}
    />
  );
}

export default function Page() {
  return (
    <SidebarLayout>
      <Contenido />
    </SidebarLayout>
  );
}
