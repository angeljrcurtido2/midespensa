import type { ReactNode } from 'react';
import { FiUser } from 'react-icons/fi';

interface Props {
  titulo: string;
  nombre: string;
  login: string;
  estado: string;
  children: ReactNode;
}

export default function UsuarioFormShell({ titulo, nombre, login, estado, children }: Props) {
  const displayName = nombre.trim() || 'Nuevo usuario';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'US';
  const activo = estado.toLowerCase() === 'activo';
  return <div className="min-h-[calc(100vh-220px)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950"><div className="mx-auto w-full max-w-[1680px] space-y-4">
    <header className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">{initials}</span><div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900 dark:text-white">{titulo}</h2><p className="mt-0.5 text-sm text-slate-500">{displayName}{login ? ` · @${login}` : ''}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${activo?'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><span className={`h-2 w-2 rounded-full ${activo?'bg-emerald-500':'bg-slate-400'}`}/>{activo?'Activo':'Inactivo'}</span></header>
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">{children}</section><aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Resumen de acceso</p><div className="mt-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"><FiUser size={19}/></span><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{displayName}</p><p className="truncate text-xs text-slate-500">{login ? `@${login}` : 'Login pendiente'}</p></div></div><div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-800"><div className="flex justify-between gap-3"><span className="text-slate-500">Estado</span><span className="font-semibold text-slate-800 dark:text-slate-200">{estado || 'Pendiente'}</span></div></div></aside></div>
  </div></div>;
}
