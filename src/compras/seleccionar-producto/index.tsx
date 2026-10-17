import { useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ListarProductos from '../../productos/components/ListarProductos';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';

/** Catálogo de productos como pantalla propia para Nueva compra: la compra queda abierta en su pestaña. */
function Contenido() {
  const cerrar = useCerrarVentana();
  const [inicial] = useState(() => { const b = sessionStorage.getItem('catalogo:busqueda') || ''; sessionStorage.removeItem('catalogo:busqueda'); return b; });
  return (
    <ListarProductos
      seleccionEnPagina
      isBuy
      initialSearch={inicial}
      setCantidadProducto={() => undefined}
      onSelect={(producto) => {
        sessionStorage.setItem('compra:producto-seleccionado', JSON.stringify(producto));
        cerrar('/compras/nueva');
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
