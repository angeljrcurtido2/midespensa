'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaUserShield, FaSave, FaLink, FaUnlink } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import GrillaPermisos from './GrillaPermisos';
import PanelLimites from './PanelLimites';
import {
  getAccesosFuncionario,
  getCatalogoAccesos,
  guardarAccesos,
  aplicarRol,
  vincularEmpleado,
  type CatalogoAccesos,
  type LimitesOperativos,
  type PermisoModulo,
  type RolFuncionario,
} from '../../services/accesos';
import { getEmpleados, type Empleado } from '../../services/rrhh';

interface GestionAccesosProps {
  idfuncionario: number | string;
  nombreFuncionario?: string;
  rolActual?: string;
  idempleadoActual?: number | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Edita los accesos de un funcionario ya existente.
 *
 * Además permite vincularlo con su legajo de RRHH: los funcionarios creados
 * antes de que existiera el vínculo quedaron sueltos, y sin esa relación no hay
 * forma de saber a qué empleado corresponde el que entra al sistema.
 */
const GestionAccesos = ({
  idfuncionario,
  nombreFuncionario,
  rolActual,
  idempleadoActual,
  onSuccess,
  onClose,
}: GestionAccesosProps) => {
  const [catalogo, setCatalogo] = useState<CatalogoAccesos | null>(null);
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);
  const [limites, setLimites] = useState<Partial<LimitesOperativos>>({});
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [idempleado, setIdempleado] = useState<number | null>(idempleadoActual ?? null);
  const [rol, setRol] = useState<RolFuncionario>((rolActual as RolFuncionario) || 'Personalizado');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mensajeError = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const r = (error as { response?: { data?: { message?: string; error?: string } } }).response;
      return r?.data?.message || r?.data?.error || fallback;
    }
    return fallback;
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, accesos, emps] = await Promise.all([
        getCatalogoAccesos(),
        getAccesosFuncionario(idfuncionario),
        getEmpleados({ page: 1, limit: 200 }),
      ]);
      setCatalogo(cat.data.data);
      setPermisos(accesos.data.data.permisos);
      setLimites(accesos.data.data.limites || {});
      setEmpleados(emps.data?.data || []);
    } catch (error) {
      setErrorMsg(mensajeError(error, 'No se pudieron cargar los accesos'));
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  }, [idfuncionario]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarRol = async (nuevoRol: RolFuncionario) => {
    setGuardando(true);
    try {
      // Aplicar el rol reescribe permisos y límites en el servidor, así que se
      // recargan para mostrar exactamente lo que quedó guardado.
      await aplicarRol(idfuncionario, nuevoRol);
      setRol(nuevoRol);
      await cargar();
      setSuccessMsg(`Rol ${nuevoRol} aplicado correctamente`);
      setSuccessOpen(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setErrorMsg(mensajeError(error, 'No se pudo aplicar el rol'));
      setErrorOpen(true);
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarAccesos(idfuncionario, {
        permisos: permisos.map((p) => ({
          modulo: p.modulo,
          ver: p.ver,
          crear: p.crear,
          editar: p.editar,
          anular: p.anular,
        })),
        limites,
      });
      setSuccessMsg('Accesos actualizados correctamente');
      setSuccessOpen(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setErrorMsg(mensajeError(error, 'No se pudieron guardar los accesos'));
      setErrorOpen(true);
    } finally {
      setGuardando(false);
    }
  };

  const guardarVinculo = async (nuevoId: number | null) => {
    setGuardando(true);
    try {
      await vincularEmpleado(idfuncionario, nuevoId);
      setIdempleado(nuevoId);
      setSuccessMsg(nuevoId ? 'Vinculado al legajo' : 'Desvinculado del legajo');
      setSuccessOpen(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setErrorMsg(mensajeError(error, 'No se pudo actualizar el vínculo'));
      setErrorOpen(true);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2.5 rounded-lg">
          <FaUserShield className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400 truncate">
            Accesos de {nombreFuncionario || `funcionario #${idfuncionario}`}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Definí a qué entra y hasta dónde puede operar
          </p>
        </div>
      </div>

      {/* Vínculo con el legajo de RRHH.
          Las altas nuevas ya vienen vinculadas desde "Nueva persona"; esto es
          para los funcionarios cargados antes de que el vínculo existiera, y
          para corregir una asignación equivocada. No tener legajo es válido:
          alguien puede usar el sistema sin estar en la nómina. */}
      <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          {idempleado ? (
            <FaLink className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <FaUnlink className="text-gray-400" />
          )}
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
            Legajo de RRHH
          </h3>
          {idempleado && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
              Vinculado
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {idempleado
            ? 'Está en la nómina: se le puede liquidar sueldo, horas extras y aguinaldo.'
            : 'Solo tiene acceso al sistema. Vinculalo a un legajo únicamente si además cobra sueldo.'}
        </p>
        <select
          value={idempleado ?? ''}
          disabled={guardando}
          onChange={(e) => guardarVinculo(e.target.value ? Number(e.target.value) : null)}
          className="border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-blue-500"
        >
          <option value="">Sin vincular</option>
          {empleados.map((e) => (
            <option key={e.idempleado} value={e.idempleado}>
              {e.nombre} {e.apellido} {e.cedula ? `- ${e.cedula}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Rol como atajo */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Aplicar un rol
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(catalogo?.roles || []).map((r) => (
            <button
              key={r.rol}
              type="button"
              disabled={guardando}
              onClick={() => cambiarRol(r.rol)}
              className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50 ${
                rol === r.rol
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  rol === r.rol
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {r.rol}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {r.modulosHabilitados} módulos
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Aplicar un rol reemplaza los accesos actuales de inmediato.
        </p>
      </div>

      <GrillaPermisos permisos={permisos} onChange={setPermisos} />
      <PanelLimites limites={limites} onChange={setLimites} />

      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold"
          >
            Cerrar
          </button>
        )}
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FaSave /> {guardando ? 'Guardando...' : 'Guardar accesos'}
        </button>
      </div>

      <ModalSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        message={successMsg}
      />
      <ModalError isOpen={errorOpen} onClose={() => setErrorOpen(false)} message={errorMsg} />
    </div>
  );
};

export default GestionAccesos;
