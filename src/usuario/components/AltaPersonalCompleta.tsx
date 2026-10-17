'use client';

import { useEffect, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaUser, FaMoneyBillWave, FaKey, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import GrillaPermisos from './GrillaPermisos';
import PanelLimites from './PanelLimites';
import {
  altaCompleta,
  getCatalogoAccesos,
  type CatalogoAccesos,
  type LimitesOperativos,
  type PermisoModulo,
  type RolFuncionario,
} from '../../services/accesos';
import { MODALIDADES, type ModalidadSalario } from '../../services/rrhh';
import VistaPreviaSalario from '../../salarios/components/VistaPreviaSalario';

interface AltaPersonalCompletaProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const PASOS = [
  { n: 1, label: 'Datos personales', icono: <FaUser /> },
  { n: 2, label: 'Sueldo', icono: <FaMoneyBillWave /> },
  { n: 3, label: 'Acceso al sistema', icono: <FaKey /> },
];

const initialForm = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  direccion: '',
  fecha_nacimiento: '',
  fecha_ingreso: new Date().toISOString().slice(0, 10),
  // Nómina
  crear_empleado: true,
  tipo_remuneracion: 'Fijo',
  aporta_ips: true,
  porcentaje_ips_empleado: 9,
  porcentaje_ips_empleador: 16.5,
  salario_base: '',
  modalidad: 'Mensual' as ModalidadSalario,
  jornada_horas: '8',
  dias_mes: '30',
  // Acceso
  crear_acceso: true,
  login: '',
  password: '',
  tipo_funcionario: 'Cajero' as RolFuncionario,
};

/**
 * Alta unificada: legajo de RRHH + acceso al sistema + permisos.
 *
 * Antes había que cargar la persona dos veces —una como empleado para poder
 * pagarle y otra como funcionario para que pudiera entrar— y nada vinculaba
 * ambos registros. Acá se define todo junto y el backend lo guarda en una sola
 * transacción: o queda completo, o no queda nada.
 */
const AltaPersonalCompleta = ({ onSuccess, onClose }: AltaPersonalCompletaProps) => {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [catalogo, setCatalogo] = useState<CatalogoAccesos | null>(null);
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);
  const [limites, setLimites] = useState<Partial<LimitesOperativos>>({});
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getCatalogoAccesos()
      .then(({ data }) => {
        setCatalogo(data.data);
        aplicarPlantilla(data.data, initialForm.tipo_funcionario);
      })
      .catch(() => {
        setErrorMsg('No se pudo cargar el catálogo de accesos');
        setErrorOpen(true);
      });
    // Sólo al montar: el catálogo no cambia durante el alta.
  }, []);

  /** Carga los permisos y límites que corresponden al rol elegido. */
  const aplicarPlantilla = (cat: CatalogoAccesos, rol: RolFuncionario) => {
    const plantilla = cat.roles.find((r) => r.rol === rol);
    const porModulo = new Map((plantilla?.permisos || []).map((p) => [p.modulo, p]));

    setPermisos(
      cat.modulos.map((m) => {
        const p = porModulo.get(m.clave);
        return {
          modulo: m.clave,
          nombre: m.nombre,
          grupo: m.grupo,
          descripcion: m.descripcion,
          ver: !!p?.ver,
          crear: !!p?.crear,
          editar: !!p?.editar,
          anular: !!p?.anular,
        };
      }),
    );
    setLimites(plantilla?.limites || {});
  };

  const set = (campo: string, valor: unknown) => setForm((f) => ({ ...f, [campo]: valor }));

  const cambiarRol = (rol: RolFuncionario) => {
    set('tipo_funcionario', rol);
    if (catalogo) aplicarPlantilla(catalogo, rol);
  };

  // Si el usuario ajusta permisos a mano, el rol deja de describir lo que tiene:
  // pasa a "Personalizado" para no mostrar una etiqueta que miente.
  const cambiarPermisos = (nuevos: PermisoModulo[]) => {
    setPermisos(nuevos);
    if (form.tipo_funcionario !== 'Personalizado') set('tipo_funcionario', 'Personalizado');
  };

  const errorPaso = useMemo(() => {
    if (paso === 1) {
      if (!form.nombre.trim() || !form.apellido.trim()) return 'Nombre y apellido son obligatorios';
      if (form.crear_empleado && !form.fecha_ingreso) return 'La fecha de ingreso es obligatoria';
    }
    if (paso === 3 && form.crear_acceso) {
      if (!form.login.trim()) return 'El usuario de acceso es obligatorio';
      if (!form.password || form.password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    return null;
  }, [paso, form]);

  const avanzar = () => {
    if (errorPaso) {
      setErrorMsg(errorPaso);
      setErrorOpen(true);
      return;
    }
    setPaso((p) => Math.min(p + 1, 3));
  };

  const guardar = async () => {
    if (errorPaso) {
      setErrorMsg(errorPaso);
      setErrorOpen(true);
      return;
    }
    if (!form.crear_empleado && !form.crear_acceso) {
      setErrorMsg('Elegí al menos una opción: cargar en nómina o dar acceso al sistema');
      setErrorOpen(true);
      return;
    }

    setLoading(true);
    try {
      await altaCompleta({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        cedula: form.cedula.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
        fecha_ingreso: form.fecha_ingreso || undefined,
        crear_empleado: form.crear_empleado,
        tipo_remuneracion: form.tipo_remuneracion,
        aporta_ips: form.aporta_ips,
        porcentaje_ips_empleado: Number(form.porcentaje_ips_empleado),
        porcentaje_ips_empleador: Number(form.porcentaje_ips_empleador),
        salario_base: form.salario_base ? Number(form.salario_base) : undefined,
        modalidad: form.modalidad,
        jornada_horas: Number(form.jornada_horas) || 8,
        dias_mes: Number(form.dias_mes) || 30,
        crear_acceso: form.crear_acceso,
        login: form.login.trim() || undefined,
        password: form.password || undefined,
        tipo_funcionario: form.tipo_funcionario,
        permisos: form.crear_acceso ? permisos : undefined,
        limites: form.crear_acceso ? limites : undefined,
      });
      setSuccessOpen(true);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      let msg = 'Error al registrar el alta';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const r = (error as { response?: { data?: { message?: string; error?: string } } }).response;
        msg = r?.data?.message || r?.data?.error || msg;
      }
      setErrorMsg(msg);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-all w-full';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full p-5 sm:p-6">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">Alta de personal</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Cargá la persona una sola vez: queda en la nómina y con su acceso al sistema.
      </p>

      {/* Pasos */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {PASOS.map((p, i) => (
          <div key={p.n} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPaso(p.n)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                paso === p.n
                  ? 'bg-blue-600 text-white'
                  : paso > p.n
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {paso > p.n ? <FaCheck /> : p.icono}
              <span className="hidden sm:inline">{p.label}</span>
            </button>
            {i < PASOS.length - 1 && <div className="w-6 h-0.5 bg-gray-200 dark:bg-gray-600" />}
          </div>
        ))}
      </div>

      {/* Paso 1: persona */}
      {paso === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className={inputClass}
              placeholder="Nombre"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
            <input
              value={form.apellido}
              onChange={(e) => set('apellido', e.target.value)}
              className={inputClass}
              placeholder="Apellido"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cédula</label>
            <input
              value={form.cedula}
              onChange={(e) => set('cedula', e.target.value)}
              className={inputClass}
              placeholder="Documento"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
            <input
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              className={inputClass}
              placeholder="Teléfono"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
            <input
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
              className={inputClass}
              placeholder="Dirección"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => set('fecha_nacimiento', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de ingreso
            </label>
            <input
              type="date"
              value={form.fecha_ingreso}
              onChange={(e) => set('fecha_ingreso', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Paso 2: nómina */}
      {paso === 2 && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => set('crear_empleado', !form.crear_empleado)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              form.crear_empleado
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  Cargar en la nómina
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Necesario para liquidarle sueldo, horas extras y aguinaldo
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0 ${
                  form.crear_empleado
                    ? 'bg-emerald-500 justify-end'
                    : 'bg-gray-300 dark:bg-gray-600 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white block" />
              </span>
            </div>
          </button>

          {form.crear_empleado && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Modalidad de pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODALIDADES.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      onClick={() => set('modalidad', m.valor)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        form.modalidad === m.valor
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          form.modalidad === m.valor
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {m.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.ayuda}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {form.modalidad === 'Hora'
                      ? 'Monto por hora'
                      : form.modalidad === 'Jornal'
                        ? 'Monto por día'
                        : form.modalidad === 'Quincenal'
                          ? 'Monto por quincena'
                          : 'Sueldo mensual'}
                  </label>
                  <NumericFormat
                    value={form.salario_base}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    onValueChange={(v) => set('salario_base', v.value || '')}
                    className={inputClass}
                    prefix="Gs. "
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Horas por jornada
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={form.jornada_horas}
                    onChange={(e) => set('jornada_horas', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <VistaPreviaSalario
                salarioBase={form.salario_base}
                modalidad={form.modalidad}
                jornadaHoras={form.jornada_horas}
                diasMes={form.dias_mes}
              />

              <button
                type="button"
                onClick={() => set('aporta_ips', !form.aporta_ips)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  form.aporta_ips
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Aporta IPS
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Se descuenta {form.porcentaje_ips_empleado}% de su remuneración
                    </p>
                  </div>
                  <span
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0 ${
                      form.aporta_ips
                        ? 'bg-emerald-500 justify-end'
                        : 'bg-gray-300 dark:bg-gray-600 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white block" />
                  </span>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      {/* Paso 3: acceso */}
      {paso === 3 && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => set('crear_acceso', !form.crear_acceso)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              form.crear_acceso
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  Dar acceso al sistema
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Creale usuario y contraseña para que pueda entrar
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0 ${
                  form.crear_acceso
                    ? 'bg-emerald-500 justify-end'
                    : 'bg-gray-300 dark:bg-gray-600 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white block" />
              </span>
            </div>
          </button>

          {form.crear_acceso && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuario
                  </label>
                  <input
                    value={form.login}
                    onChange={(e) => set('login', e.target.value)}
                    className={inputClass}
                    placeholder="Con el que inicia sesión"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className={inputClass}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Rol
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(catalogo?.roles || []).map((r) => (
                    <button
                      key={r.rol}
                      type="button"
                      onClick={() => cambiarRol(r.rol)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        form.tipo_funcionario === r.rol
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          form.tipo_funcionario === r.rol
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
                  El rol precarga los accesos; podés ajustarlos abajo uno por uno.
                </p>
              </div>

              <GrillaPermisos permisos={permisos} onChange={cambiarPermisos} />
              <PanelLimites limites={limites} onChange={setLimites} />
            </>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {paso > 1 ? (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold flex items-center gap-2"
          >
            <FaArrowLeft /> Atrás
          </button>
        ) : (
          onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold"
            >
              Cancelar
            </button>
          )
        )}

        {paso < 3 ? (
          <button
            type="button"
            onClick={avanzar}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
          >
            Siguiente <FaArrowRight />
          </button>
        ) : (
          <button
            type="button"
            onClick={guardar}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaCheck /> {loading ? 'Guardando...' : 'Registrar alta'}
          </button>
        )}
      </div>

      <ModalSuccess
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          if (onClose) onClose();
        }}
        message="Alta registrada correctamente"
      />
      <ModalError isOpen={errorOpen} onClose={() => setErrorOpen(false)} message={errorMsg} />
    </div>
  );
};

export default AltaPersonalCompleta;
