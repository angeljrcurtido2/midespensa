import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/SidebarLayout';
import ListarProveedores from '../../proveedor/components/ListarProveedores';

/** Selector de proveedor como ventana propia para mantener abierta la compra. */
export default function Page() {
  const navigate = useNavigate();

  const seleccionar = (proveedor: any) => {
    sessionStorage.setItem('compra:proveedor-seleccionado', JSON.stringify(proveedor));
    navigate('/compras/nueva');
  };

  return (
    <SidebarLayout>
      <ListarProveedores onSelect={seleccionar} />
    </SidebarLayout>
  );
}
