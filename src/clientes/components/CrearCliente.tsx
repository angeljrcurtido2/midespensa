'use client';

import { useMemo, useState } from 'react';
import { FiFileText, FiMapPin, FiPhone, FiSave, FiTag, FiUser } from 'react-icons/fi';
import ModalSuccess from '../../components/ModalSuccess';
import { createClient } from '../../services/cliente';
import { initialFormCliente, selectFieldsConfig } from '../utils/utils';
import SelectInput from './SelectInput';

interface CrearClienteProps { onSuccess?: () => void; onClose?: () => void; }

const CrearCliente = ({ onSuccess, onClose }: CrearClienteProps) => {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormCliente, tipo_documento: '' });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
    setErrorMessage('');
  };
  const nombre = useMemo(() => `${formData.nombre} ${formData.apellido}`.trim(), [formData.nombre, formData.apellido]);
  const initials = useMemo(() => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join('') || 'CL', [nombre]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErrorMessage('');
    try { await createClient(formData); setSuccessModalOpen(true); onSuccess?.(); }
    catch (error: any) { console.error(error); setErrorMessage(error?.response?.data?.error || 'No se pudo crear el cliente. Revisá los datos e intentá nuevamente.'); }
    finally { setSaving(false); }
  };
  const handleSuccessClose = () => { setSuccessModalOpen(false); setFormData({ ...initialFormCliente, tipo_documento: '' }); onClose?.(); };
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600';
  const fields = [
    { label:'Nombre', name:'nombre', placeholder:'Nombre del cliente', icon:FiUser },
    { label:'Apellido o razón social', name:'apellido', placeholder:'Apellido o empresa', icon:FiUser },
    { label:'Documento', name:'numDocumento', placeholder:'Número de documento', icon:FiFileText },
    { label:'Teléfono', name:'telefono', placeholder:'+595 000 000000', icon:FiPhone },
    { label:'Dirección', name:'direccion', placeholder:'Calle, número y ciudad', icon:FiMapPin },
    { label:'Descripción', name:'descripcion', placeholder:'Nota interna (opcional)', icon:FiTag },
  ];
  return <div className="min-h-[calc(100vh-220px)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950"><div className="mx-auto w-full max-w-[1680px] space-y-4">
    <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"><FiUser size={19}/></span><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo registro de cliente</h2><p className="mt-0.5 text-sm text-slate-500">Datos de identidad, contacto y clasificación</p></div></section>
    {errorMessage&&<div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{errorMessage}</div>}
    <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300"><FiUser size={19}/></span><div><h3 className="font-bold text-slate-900 dark:text-white">Información del cliente</h3><p className="mt-0.5 text-xs text-slate-500">Completá los datos para crear la ficha</p></div></header>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">{fields.map(({label,name,placeholder,icon:Icon})=><label key={name} className="block min-w-0"><span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Icon className="text-blue-500"/>{label}</span><input type="text" name={name} value={formData[name as keyof typeof formData]??''} onChange={handleChange} placeholder={placeholder} required={name==='nombre'} className={inputClass}/></label>)}</div>
        <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8"><div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"><FiTag size={18}/></span><div><h3 className="font-bold text-slate-900 dark:text-white">Clasificación</h3><p className="mt-0.5 text-xs text-slate-500">Segmentá el cliente con sus datos fiscales</p></div></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{selectFieldsConfig.map(field=><label key={field.name} className="block min-w-0"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{field.placeholder.replace(/^Seleccione\s+/i,'')}</span><SelectInput name={field.name} value={String(formData[field.name as keyof typeof formData]??'')} onChange={handleChange} placeholder={field.placeholder} options={field.options}/></label>)}</div></div>
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-xs text-slate-500">Los campos opcionales se pueden completar más adelante.</p><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{saving?<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/>:<FiSave size={17}/ >}{saving?'Guardando…':'Crear cliente'}</button></footer>
      </section>
      <aside className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Vista previa</p><div className="mt-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-extrabold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">{initials}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{nombre||'Nombre del cliente'}</p><p className="truncate text-xs text-slate-500">{formData.numDocumento||'Sin documento'}</p></div></div><div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800"><div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Tipo de cliente</span><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">{formData.tipo_cliente||'—'}</span></div><p className="text-sm text-slate-600 dark:text-slate-300">{formData.telefono||'Sin teléfono'}</p><p className="text-sm text-slate-600 dark:text-slate-300">{formData.direccion||'Sin dirección'}</p></div></aside>
    </form>
  </div><ModalSuccess isOpen={successModalOpen} onClose={handleSuccessClose} message="Cliente creado con éxito"/></div>;
};

export default CrearCliente;
