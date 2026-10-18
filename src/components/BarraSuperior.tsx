import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  BanknotesIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { NOMBRE_SISTEMA } from '../config/marca';
import { useDarkModeStore } from '../../store/useDarkModeStore';
import { getDataUser } from '../services/usuarios';

interface SubItem {
  name: string;
  path: string;
  children?: { name: string; path: string }[];
}
interface NavItem {
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  path?: string;
  subItems?: SubItem[];
}

/** Toldo de almacén: es el símbolo de la marca. */
export function LogoToldo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="4" y="20" width="40" height="24" rx="4" fill="#fff7ed" stroke="#c2410c" strokeWidth="2" />
      <path d="M4 20 8 6h32l4 14z" fill="#ea580c" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${8 + i * 10} 6h5l-1.2 14H${6.4 + i * 10}z`} fill="#fff7ed" opacity="0.9" />
      ))}
      <rect x="19" y="28" width="10" height="16" rx="2" fill="#c2410c" />
    </svg>
  );
}

interface Props {
  navItems: NavItem[];
  onCerrarSesion: () => void;
}

const iniciales = (n = '') => n.trim().split(' ').map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'MD';

export default function BarraSuperior({ navItems, onCerrarSesion }: Props) {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [acordeon, setAcordeon] = useState<string | null>(null);
  const [usuario, setUsuario] = useState('');
  const darkMode = useDarkModeStore((s) => s.darkMode);
  const toggleDarkMode = useDarkModeStore((s) => s.toggleDarkMode);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDataUser()
      .then((r: any) => setUsuario(r.data?.nombreUsuario || ''))
      .catch(() => {
        try { setUsuario(JSON.parse(localStorage.getItem('usuario') || '{}').username || ''); } catch { /* sin datos */ }
      });
  }, []);

  useEffect(() => { setAbierto(null); setDrawer(false); }, [pathname]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAbierto(null); setDrawer(false); } };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, []);

  const rutas = useMemo(() => {
    const s = new Set<string>();
    navItems.forEach((g) => g.subItems?.forEach((i) => { s.add(i.path); i.children?.forEach((c) => s.add(c.path)); }));
    return s;
  }, [navItems]);

  const grupoActivo = (g: NavItem) => !!g.subItems?.some((i) => i.path !== '/' && pathname.startsWith(i.path));
  const puedeVender = rutas.has('/ventas/nueva');

  const inferior = [
    { to: '/dashboard', label: 'Inicio', Icono: HomeIcon, ok: true },
    { to: '/ventas/nueva', label: 'Vender', Icono: ShoppingCartIcon, ok: puedeVender },
    { to: '/productos', label: 'Productos', Icono: CubeIcon, ok: rutas.has('/productos') },
    { to: '/movimiento/cierrecaja', label: 'Caja', Icono: BanknotesIcon, ok: rutas.has('/movimiento/cierrecaja') },
  ].filter((i) => i.ok);

  const itemLink = 'block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-orange-50 hover:text-orange-800 dark:text-stone-200 dark:hover:bg-stone-800';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-orange-200/70 bg-white/90 backdrop-blur dark:border-stone-700 dark:bg-stone-900/90">
        {/* Franja de toldo */}
        <div className="h-1.5 w-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#ea580c 0 24px,#fff7ed 24px 48px)' }} />
        <div ref={contenedor} className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 py-2 sm:px-5">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <LogoToldo />
            <span className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-white">{NOMBRE_SISTEMA}</span>
          </Link>

          <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex" aria-label="Principal">
            {navItems.map((g) => (
              <div key={g.name} className="relative">
                <button
                  type="button"
                  aria-expanded={abierto === g.name}
                  onClick={() => setAbierto((a) => (a === g.name ? null : g.name))}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                    grupoActivo(g) || abierto === g.name
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
                  )}
                >
                  <g.icon className="h-4 w-4" />
                  {g.name}
                  <ChevronDownIcon className={clsx('h-3.5 w-3.5 transition-transform', abierto === g.name && 'rotate-180')} />
                </button>
                {abierto === g.name && g.subItems && (
                  <div className="absolute left-0 top-full z-50 mt-2 max-h-[75vh] w-72 overflow-y-auto rounded-2xl border border-orange-100 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                    {g.subItems.map((i) => (
                      <div key={i.path} className="mb-1">
                        <Link to={i.path} className={clsx(itemLink, 'font-semibold', pathname === i.path && 'bg-orange-50 text-orange-800')}>{i.name}</Link>
                        {i.children?.map((c) => (
                          <Link key={c.path} to={c.path} className={clsx(itemLink, 'ml-4 py-1.5 text-[13px] text-stone-500', pathname === c.path && 'text-orange-800')}>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {puedeVender && (
              <Link to="/ventas/nueva" className="hidden items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-700 sm:flex">
                <ShoppingCartIcon className="h-4 w-4" /> Vender
              </Link>
            )}
            <button type="button" onClick={toggleDarkMode} aria-label="Cambiar tema" className="grid h-9 w-9 place-items-center rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <div className="relative">
              <button type="button" onClick={() => setAbierto((a) => (a === '__u' ? null : '__u'))} aria-label="Mi cuenta"
                className="grid h-9 w-9 place-items-center rounded-full bg-orange-600 text-xs font-bold text-white">
                {iniciales(usuario)}
              </button>
              {abierto === '__u' && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-orange-100 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                  <p className="truncate px-3 py-2 text-sm font-semibold text-stone-800 dark:text-stone-100">{usuario || 'Mi cuenta'}</p>
                  <button type="button" onClick={onCerrarSesion} className={clsx(itemLink, 'flex w-full items-center gap-2 text-left')}>
                    <ArrowRightOnRectangleIcon className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => setDrawer(true)} aria-label="Abrir menú" className="grid h-9 w-9 place-items-center rounded-full text-stone-700 hover:bg-stone-100 lg:hidden dark:text-stone-200 dark:hover:bg-stone-800">
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Menú completo en celular */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 shadow-2xl dark:bg-stone-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 font-extrabold text-stone-900 dark:text-white"><LogoToldo className="h-8 w-8" />{NOMBRE_SISTEMA}</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Cerrar menú" className="grid h-9 w-9 place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            {navItems.map((g) => (
              <div key={g.name} className="border-b border-stone-100 py-1 dark:border-stone-800">
                <button type="button" onClick={() => setAcordeon((a) => (a === g.name ? null : g.name))} className="flex w-full items-center justify-between rounded-lg px-2 py-3 text-left font-semibold text-stone-800 dark:text-stone-100">
                  <span className="flex items-center gap-2"><g.icon className="h-5 w-5 text-orange-600" />{g.name}</span>
                  <ChevronDownIcon className={clsx('h-4 w-4 transition-transform', acordeon === g.name && 'rotate-180')} />
                </button>
                {acordeon === g.name && g.subItems?.map((i) => (
                  <div key={i.path}>
                    <Link to={i.path} className={clsx(itemLink, 'ml-7')}>{i.name}</Link>
                    {i.children?.map((c) => <Link key={c.path} to={c.path} className={clsx(itemLink, 'ml-12 py-1.5 text-[13px] text-stone-500')}>{c.name}</Link>)}
                  </div>
                ))}
              </div>
            ))}
            <button type="button" onClick={onCerrarSesion} className="mt-4 flex w-full items-center gap-2 rounded-xl bg-stone-100 px-3 py-3 font-semibold text-stone-800 dark:bg-stone-800 dark:text-stone-100">
              <ArrowRightOnRectangleIcon className="h-5 w-5" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Barra inferior en celular */}
      <nav aria-label="Accesos rápidos" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-orange-200 bg-white/95 backdrop-blur lg:hidden dark:border-stone-700 dark:bg-stone-900/95">
        {inferior.map(({ to, label, Icono }) => (
          <Link key={to} to={to} className={clsx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold', pathname.startsWith(to) ? 'text-orange-700' : 'text-stone-500')}>
            <Icono className="h-6 w-6" />{label}
          </Link>
        ))}
        <button type="button" onClick={() => setDrawer(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-stone-500">
          <Bars3Icon className="h-6 w-6" />Menú
        </button>
      </nav>
    </>
  );
}
