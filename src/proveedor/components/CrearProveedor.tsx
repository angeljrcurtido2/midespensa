'use client';

import { useState } from 'react';
import { FiMapPin, FiPhone, FiSave, FiTruck, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { initialForm } from '../utils/utils';
import { createProveedor } from '../../services/proveedor';
import ModalSuccess from '../../components/ModalSuccess';

interface Props { onSuccess?: () => void; onClose?: () => void; }

export default function CrearProveedor({ onSuccess, onClose }: Props) {
  const [formData, setFormData] = useState(initialForm);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); e.stopPropagation(); setSaving(true); setErrorMessage('');
    try { await createProveedor(formData); setSuccessOpen(true); onSuccess?.(); }
    catch (error: any) { console.error(error); setErrorMessage(error?.response?.data?.error || 'No se pudo registrar el proveedor. Revisá los datos e intentá nuevamente.'); }
    finally { setSaving(false); }
  };
  const cerrarExito = () => { setSuccessOpen(false); setFormData(initialForm); onClose?.(); };
  const fields = [
    {label:'Nombre de contacto', name:'nombre', placeholder:'Nombre de la persona de contacto', icon:FiTruck},
    {label:'Razón social', name:'razon', placeholder:'Nombre legal de la empresa', icon:FiFileText},
    {label:'RUC', name:'ruc', placeholder:'Ej.: 80000000-0', icon:FiFileText},
    {label:'Teléfono', name:'telefono', placeholder:'+595 000 000000', icon:FiPhone},
    {label:'Dirección', name:'direccion', placeholder:'Calle, número y ciudad', icon:FiMapPin},
  ];
  const input = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
  return <div className="min-h-[calc(100vh-220px)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
    <div className="mx-auto w-full max-w-[1680px] space-y-4">
      <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"><FiTruck size={20}/></span><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo registro de proveedor</h2><p className="mt-0.5 text-sm text-slate-500">Datos de identificaci?n y contacto</p></div></section>
      {errorMessage && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{errorMessage}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><FiTruck /></span><div><h3 className="font-bold text-slate-900 dark:text-white">Datos del proveedor</h3><p className="mt-0.5 text-xs text-slate-500">Identificación y medios de contacto</p></div></header>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">{fields.map(({label,name,placeholder,icon:Icon})=><label key={name} className="block min-w-0"><span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Icon className="text-blue-500" />{label}</span><input className={input} name={name} value={formData[name as keyof typeof formData]} onChange={handleChange} placeholder={placeholder} /></label>)}</div>
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-xs text-slate-500">Podés completar o modificar estos datos más adelante.</p><button disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:opacity-60">{saving?<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/>:<FiSave/>}{saving?'Guardando…':'Guardar proveedor'}</button></footer>
        </section>
        <aside className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Vista previa</p><div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white"><FiTruck size={21}/></div><h3 className="mt-3 font-bold text-slate-900 dark:text-white">{formData.razon || formData.nombre || 'Nombre del proveedor'}</h3><p className="mt-1 text-xs text-slate-500">{formData.ruc || 'RUC pendiente'}</p><div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800"><p className="text-sm text-slate-600 dark:text-slate-300">{formData.telefono || 'Sin teléfono'}</p><p className="text-sm text-slate-600 dark:text-slate-300">{formData.direccion || 'Sin dirección'}</p></div><div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"><FiCheckCircle className="mb-2" size={17}/>Mantené actualizados los datos para identificar con facilidad tus compras y proveedores.</div></aside>
      </form>
    </div>
    <ModalSuccess isOpen={successOpen} onClose={cerrarExito} message="Proveedor creado con éxito"/>
  </div>;
}
