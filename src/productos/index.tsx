import SidebarLayout from '../components/SidebarLayout';
import ListarProductos from './components/ListarProductos';
export default function Page() {
  return (
    <div>
      <SidebarLayout><ListarProductos /></SidebarLayout>
    </div>
  );
}
