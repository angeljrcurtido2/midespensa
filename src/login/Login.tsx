'use client';

import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { loginUsuario } from '../services/login';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { getConfiguracionValorString } from '../services/configuracion';
import ModalRegistroUsuario from './components/ModalRegister';
import { NOMBRE_SISTEMA } from '../config/marca';
import { LogoToldo } from '../components/BarraSuperior';

const BENEFICIOS = [
  { t: 'Ventas y fiado', d: 'Anotá quién te debe y cobrá las cuotas.' },
  { t: 'Stock al día', d: 'Sabé qué te falta antes de que se acabe.' },
  { t: 'Caja ordenada', d: 'Ingresos, egresos y cierre de caja.' },
];

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

  useEffect(() => { document.title = `Ingresar · ${NOMBRE_SISTEMA}`; }, []);

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (cargando) return;
    if (!login.trim() || !password) { setError('Escribí tu usuario y tu contraseña.'); return; }
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
      window.setTimeout(() => navigate('/dashboard'), reducir ? 120 : 600);
    } catch (err: any) {
      const status = err?.response?.status;
      setError(err?.response?.data?.error || (status ? 'No pudimos ingresar. Probá de nuevo.' : 'No hay conexión con el servidor. Revisá tu internet.'));
    } finally { setCargando(false); }
  };

  const campo = 'block w-full rounded-2xl border-2 bg-white py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/15';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffaf3] text-stone-800">
      {/* Toldo */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 sm:h-28"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg,#ea580c 0 56px,#fff7ed 56px 112px)', boxShadow: '0 8px 0 -2px #c2410c' }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-24 h-6 sm:top-28"
        style={{ backgroundImage: 'radial-gradient(circle at 28px 0,#ea580c 27px,transparent 28px),radial-gradient(circle at 84px 0,#fff7ed 27px,transparent 28px)', backgroundSize: '112px 28px', backgroundRepeat: 'repeat-x' }} />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-36 sm:pt-44">
        <motion.div
          initial={reducir ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-3xl border border-orange-100 bg-white p-7 shadow-lg shadow-orange-900/10 sm:p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <LogoToldo className="h-16 w-16" />
            <h1 className="mt-3 text-[26px] font-extrabold tracking-tight text-stone-900">{NOMBRE_SISTEMA}</h1>
            <p className="mt-1 text-[15px] text-stone-600">Tu despensa o almacén ordenado, gratis.</p>
          </div>

          <form onSubmit={enviar} className="space-y-4" noValidate>
            <div>
              <label htmlFor="usuario" className="mb-1 block text-sm font-bold text-stone-700">Usuario</label>
              <div className="relative">
                <User size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input id="usuario" name="usuario" type="text" value={login} onChange={(e) => { setLogin(e.target.value); setError(''); }} autoComplete="username" autoFocus={!login} placeholder="Tu usuario"
                  aria-invalid={!!error || undefined} className={`${campo} pl-11 pr-4 ${error ? 'border-red-400' : 'border-stone-200'}`} />
              </div>
            </div>

            <div>
              <label htmlFor="clave" className="mb-1 block text-sm font-bold text-stone-700">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input id="clave" name="clave" type={verClave ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" autoFocus={!!login} placeholder="Tu contraseña"
                  onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => setMayusculas(e.getModifierState?.('CapsLock') ?? false)}
                  aria-invalid={!!error || undefined} className={`${campo} pl-11 pr-12 ${error ? 'border-red-400' : 'border-stone-200'}`} />
                <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verClave}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-stone-500 hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-orange-600">
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
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="h-4 w-4 rounded border-stone-300 text-orange-600 accent-orange-600 focus:ring-orange-600" />
              Recordar mi usuario
            </label>

            <div aria-live="assertive">
              <AnimatePresence>
                {error && (
                  <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-px shrink-0 text-red-500" /> <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button type="submit" disabled={cargando} whileTap={reducir ? undefined : { scale: 0.98 }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-600 text-[15px] font-extrabold text-white shadow-md shadow-orange-700/25 transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/30 disabled:cursor-wait disabled:opacity-80">
              {cargando ? <><Loader2 size={18} className="animate-spin" /> Entrando…</> : 'Entrar a mi despensa'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            ¿Todavía no tenés cuenta?{' '}
            <button type="button" onClick={() => setRegistro(true)} className="font-extrabold text-orange-700 hover:underline">Crear cuenta gratis</button>
          </p>
        </motion.div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <li key={b.t} className="rounded-2xl bg-orange-50 px-4 py-3 text-center sm:text-left">
              <p className="text-sm font-extrabold text-orange-900">{b.t}</p>
              <p className="mt-0.5 text-xs leading-snug text-stone-600">{b.d}</p>
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-8 text-center text-xs text-stone-500">© {new Date().getFullYear()} {NOMBRE_SISTEMA}</p>
      </div>

      <AnimatePresence>
        {entrando && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-orange-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducir ? 0.1 : 0.4 }}>
            <div className="flex flex-col items-center gap-4 text-white">
              <Loader2 size={34} className="animate-spin" />
              <p className="text-lg font-bold">Abriendo tu despensa…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalRegistroUsuario onClose={() => setRegistro(false)} onSuccess={() => setRegistro(false)} isOpen={registro} />
    </div>
  );
};

export default Login;
