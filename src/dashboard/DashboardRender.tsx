import InicioDespensa from './InicioDespensa';
import { usePermisos } from '../hooks/usePermisos';

/** Inicio de Mi Despensa. Mientras se resuelven los permisos no se monta nada: así no se disparan consultas que después se esconden. */
export default function DashboardRender() {
  const { cargando } = usePermisos();
  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-orange-600" />
      </div>
    );
  }
  return (
    <>
      <InicioDespensa />
    </>
  );
}
