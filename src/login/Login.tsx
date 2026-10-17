'use client';

import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import { loginUsuario } from '../services/login';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { getConfiguracionValorString } from '../services/configuracion';
import ModalRegistroUsuario from './components/ModalRegister';
import { NOMBRE_SISTEMA, MONOGRAMA } from '../config/marca';


/** Monograma + nombre. El cuadro azul es el mismo azul base del sistema. */
function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-xl text-[15px] font-extrabold tracking-tight ${claro ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'}`}>{MONOGRAMA}</span>
      <span className={`text-[19px] font-bold tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>{NOMBRE_SISTEMA}</span>
    </div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const reducir = useReducedMotion();
  const setUserRole = useUserStore((s) => s.setUserRole);
  const setHeaderColor = useThemeStore((s) => s.setHeaderColor);
  const setBackgroundColor = useThemeStore((s) => s.setBackgroundColor);
  const setTextColor = useThemeStore((s) => s.setTextColor);

  const [login, setLogin] = useState(() => { try { return localStorage.getItem('ultimo_usuario') || ''; } catch { return ''; } });
  const [recordar, setRecordar] = useState(() => { try { return localStorage.getItem('recordar_usuario') !== '0'; } catch { return true; } });
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [registro, setRegistro] = useState(false);

  useEffect(() => { document.title = `Iniciar sesión · ${NOMBRE_SISTEMA}`; }, []);

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (cargando) return;
    if (!login.trim() || !password) { setError('Ingresá tu usuario y tu contraseña.'); return; }
    setError(''); setCargando(true);
    try {
      const res = await loginUsuario(login.trim(), password);
      const { acceso, login: username, token } = res.data;
      localStorage.setItem('usuario', JSON.stringify({ acceso, username }));
      localStorage.setItem('auth_token', token);
      try {
        localStorage.setItem('recordar_usuario', recordar ? '1' : '0');
        if (recordar) localStorage.setItem('ultimo_usuario', login.trim()); else localStorage.removeItem('ultimo_usuario');
      } catch { /* sin almacenamiento */ }
      setUserRole(acceso);
      await Promise.all([
        getConfiguracionValorString('headercolor_gral').then((r: any) => setHeaderColor(r.data.valor || 'blue')).catch(() => setHeaderColor('blue')),
        getConfiguracionValorString('backgroundcolor_gral').then((r: any) => setBackgroundColor(r.data.valor || 'white')).catch(() => setBackgroundColor('white')),
        getConfiguracionValorString('textcolor_gral').then((r: any) => setTextColor(r.data.valor || 'black')).catch(() => setTextColor('black')),
      ]);
      setEntrando(true);
      window.setTimeout(() => navigate('/dashboard'), reducir ? 120 : 700);
    } catch (err: any) {
      const status = err?.response?.status;
      setError(err?.response?.data?.error || (status ? 'No pudimos iniciar sesión. Intentá de nuevo.' : 'No hay conexión con el servidor. Revisá tu internet.'));
    } finally { setCargando(false); }
  };

  const campo = 'block w-full rounded-lg border bg-white py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15';
  const aparecer = (i: number) => reducir ? {} : ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-blue-600 lg:order-2 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20">
        {/* trama de puntos y un halo suave: da profundidad sin degradados de colores */}
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.22) 1px, transparent 1.2px)', backgroundSize: '26px 26px', maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-sky-300/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 h-[420px] w-[420px] rounded-full bg-blue-900/35 blur-[100px]" />

        <div className="relative"><Marca claro /></div>

        <div className="relative">
          <motion.h2 {...(reducir ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7 } })} className="max-w-[18ch] text-[40px] font-bold leading-[1.08] tracking-tight text-white xl:text-[46px]">
            Tu negocio ordenado, sin pagar nada.
          </motion.h2>
          <motion.p {...(reducir ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.15, duration: 0.7 } })} className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-blue-100">
            Registrá ventas y compras, controlá tu stock y tu caja. Gratis, sin instalar nada y desde cualquier dispositivo.
          </motion.p>
          <ul className="mt-10 space-y-3 pb-6 text-[15px] text-white">
            {['Ventas y compras al contado', 'Stock, categorías y código de barras', 'Caja, ingresos y egresos', 'Informes de tu negocio'].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-xs">✓</span>{t}</li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[13px] text-blue-100/90"><ShieldCheck size={16} /> Tus datos viajan cifrados y cada cuenta ve solo su información.</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:invisible"><Marca /></div>
          <p className="hidden text-sm text-slate-600 sm:block">
            ¿No tenés cuenta?{' '}
            <button type="button" onClick={() => setRegistro(true)} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Crear cuenta</button>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <motion.h1 {...aparecer(0)} className="text-[30px] font-bold tracking-tight text-slate-900">Iniciar sesión</motion.h1>
          <motion.p {...aparecer(1)} className="mt-2 text-[15px] text-slate-600">Ingresá con tu usuario y contraseña para continuar.</motion.p>

          <form onSubmit={enviar} className="mt-8 space-y-5" noValidate>
            <motion.div {...aparecer(2)}>
              <label htmlFor="usuario" className="mb-1.5 block text-sm font-medium text-slate-700">Usuario</label>
              <div className="relative">
                <User size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="usuario" name="usuario" type="text" value={login} onChange={(e) => { setLogin(e.target.value); setError(''); }} autoComplete="username" autoFocus={!login} placeholder="Tu usuario"
                  aria-invalid={!!error || undefined} className={`${campo} pl-11 pr-4 ${error ? 'border-red-400' : 'border-slate-300'}`} />
              </div>
            </motion.div>

            <motion.div {...aparecer(3)}>
              <label htmlFor="clave" className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="clave" name="clave" type={verClave ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" autoFocus={!!login} placeholder="Tu contraseña"
                  onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => setMayusculas(e.getModifierState?.('CapsLock') ?? false)}
                  aria-invalid={!!error || undefined} className={`${campo} pl-11 pr-12 ${error ? 'border-red-400' : 'border-slate-300'}`} />
                <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verClave}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600">
                  {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {mayusculas && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs text-amber-700">
                    Tenés activado Bloq Mayús.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div {...aparecer(4)} className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                Recordar mi usuario
              </label>
            </motion.div>

            <div aria-live="assertive">
              <AnimatePresence>
                {error && (
                  <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-px shrink-0 text-red-500" /> <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div {...aparecer(5)}>
              <motion.button type="submit" disabled={cargando} whileTap={reducir ? undefined : { scale: 0.99 }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 disabled:cursor-wait disabled:opacity-80">
                {cargando ? <><Loader2 size={18} className="animate-spin" /> Verificando…</> : 'Ingresar'}
              </motion.button>
            </motion.div>
          </form>

          <motion.p {...aparecer(6)} className="mt-8 text-center text-sm text-slate-600 sm:hidden">
            ¿No tenés cuenta?{' '}
            <button type="button" onClick={() => setRegistro(true)} className="font-semibold text-blue-600 hover:underline">Crear cuenta</button>
          </motion.p>
        </div>

        <p className="text-center text-xs text-slate-500">© {new Date().getFullYear()} {NOMBRE_SISTEMA} · Todos los derechos reservados</p>
      </main>

      <AnimatePresence>
        {entrando && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-blue-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducir ? 0.1 : 0.4 }}>
            <div className="flex flex-col items-center gap-4 text-white">
              <Loader2 size={34} className="animate-spin" />
              <p className="text-lg font-medium">Cargando tu espacio de trabajo…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalRegistroUsuario onClose={() => setRegistro(false)} onSuccess={() => setRegistro(false)} isOpen={registro} />
    </div>
  );
};

export default Login;
