import SidebarLayout from '../../components/SidebarLayout';
import PaginaFormulario from '../../components/PaginaFormulario';
import { useCerrarVentana } from '../../hooks/useAlVolverALaVentana';
import AltaPersonalCompleta from '../../usuario/components/AltaPersonalCompleta';
function Contenido(){const cerrar=useCerrarVentana();return <PaginaFormulario titulo="Nueva persona" volverA="/accesos" textoVolver="Volver a usuarios y accesos"><AltaPersonalCompleta onSuccess={()=>undefined} onClose={()=>cerrar('/accesos')}/></PaginaFormulario>;}
export default function Page(){return <SidebarLayout><Contenido/></SidebarLayout>;}
