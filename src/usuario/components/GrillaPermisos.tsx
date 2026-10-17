'use client';

import { useMemo, type ReactNode } from 'react';
import { FaEye, FaPlus, FaPen, FaBan, FaLayerGroup } from 'react-icons/fa';
import type { AccionPermiso, PermisoModulo } from '../../services/accesos';

interface GrillaPermisosProps {
  permisos: PermisoModulo[];
  onChange: (permisos: PermisoModulo[]) => void;
  /** Sólo lectura: para mostrar los accesos sin permitir editarlos. */
  readOnly?: boolean;
}

const ACCIONES: { clave: AccionPermiso; label: string; icono: ReactNode; ayuda: string }[] = [
  { clave: 'ver', label: 'Ver', icono: <FaEye />, ayuda: 'Entrar y consultar' },
  { clave: 'crear', label: 'Crear', icono: <FaPlus />, ayuda: 'Registrar nuevos' },
  { clave: 'editar', label: 'Editar', icono: <FaPen />, ayuda: 'Modificar existentes' },
  { clave: 'anular', label: 'Anular', icono: <FaBan />, ayuda: 'Dar de baja' },
];

/**
 * Grilla de módulos × acciones.
 *
 * Se agrupa por área (Finanzas, Gestión, RRHH...) porque la pregunta real del
 * usuario no es "¿qué módulos habilito?" sino "¿a qué parte del negocio entra
 * esta persona?".
 *
 * Regla que se aplica sola: desmarcar "Ver" apaga las demás acciones, y marcar
 * cualquier acción enciende "Ver". Un permiso de crear sin ver dejaría a la
 * persona con acceso a la API pero sin la pantalla, que es un estado imposible
 * de entender desde afuera.
 */
const GrillaPermisos = ({ permisos, onChange, readOnly = false }: GrillaPermisosProps) => {
  const grupos = useMemo(() => {
    const mapa = new Map<string, PermisoModulo[]>();
    permisos.forEach((p) => {
      const grupo = p.grupo || 'Otros';
      if (!mapa.has(grupo)) mapa.set(grupo, []);
      mapa.get(grupo)!.push(p);
    });
    return [...mapa.entries()];
  }, [permisos]);

  const actualizar = (modulo: string, accion: AccionPermiso, valor: boolean) => {
    if (readOnly) return;
    onChange(
      permisos.map((p) => {
        if (p.modulo !== modulo) return p;
        if (accion === 'ver' && !valor) {
          // Sin ver no se puede operar: se apaga todo el módulo.
          return { ...p, ver: false, crear: false, editar: false, anular: false };
        }
        return { ...p, [accion]: valor, ver: valor ? true : p.ver };
      }),
    );
  };

  const toggleGrupo = (grupo: string, encender: boolean) => {
    if (readOnly) return;
    onChange(
      permisos.map((p) =>
        (p.grupo || 'Otros') === grupo
          ? encender
            ? { ...p, ver: true, crear: true, editar: true, anular: false }
            : { ...p, ver: false, crear: false, editar: false, anular: false }
          : p,
      ),
    );
  };

  const totalHabilitados = permisos.filter((p) => p.ver).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FaLayerGroup className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Accesos por módulo</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
          {totalHabilitados} de {permisos.length} habilitados
        </span>
      </div>

      {grupos.map(([grupo, modulos]) => {
        const todosEncendidos = modulos.every((m) => m.ver);
        return (
          <div
            key={grupo}
            className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 flex items-center justify-between gap-2">
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{grupo}</p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo, !todosEncendidos)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {todosEncendidos ? 'Quitar todo' : 'Habilitar todo'}
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {modulos.map((p) => (
                <div key={p.modulo} className="p-3 sm:px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          p.ver
                            ? 'text-gray-800 dark:text-gray-100'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {p.nombre || p.modulo}
                      </p>
                      {p.descripcion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.descripcion}</p>
                      )}
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {ACCIONES.map((a) => {
                        const activo = !!p[a.clave];
                        // Las acciones distintas de "ver" se atenúan cuando el
                        // módulo está apagado, para que se vea que dependen de él.
                        const deshabilitado = readOnly || (a.clave !== 'ver' && !p.ver);
                        return (
                          <button
                            key={a.clave}
                            type="button"
                            title={`${a.label}: ${a.ayuda}`}
                            disabled={deshabilitado}
                            onClick={() => actualizar(p.modulo, a.clave, !activo)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all flex items-center gap-1.5 ${
                              activo
                                ? a.clave === 'anular'
                                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                  : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                            } ${deshabilitado ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-400'}`}
                          >
                            {a.icono}
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GrillaPermisos;
