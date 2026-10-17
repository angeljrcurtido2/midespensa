'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiSave, FiUser, FiPhone, FiMapPin, FiFileText, FiTag, FiCheckCircle } from 'react-icons/fi';
import { getClientById, updateClient } from '../../services/cliente';
import { selectFieldsConfig } from '../utils/utils';
import SelectInput from './SelectInput';
import ModalSuccess from '../../components/ModalSuccess';

interface EditarClienteProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialFormCliente = {
  nombre: '', apellido: '', tipo: 'FISICA', numDocumento: '', telefono: '', direccion: '',
  genero: 'M', estado: 'activo', descripcion: '', tipo_cliente: 'MINORISTA', tipo_documento: '',
};

const EditarCliente = ({ id, onSuccess, onClose }: EditarClienteProps) => {
  const [formData, setFormData] = useState(initialFormCliente);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let activo = true;
    setLoading(true);
    getClientById(id).then((res) => {
      if (activo) {
        const cliente = res.data.data;
        setFormData({ ...initialFormCliente, ...cliente, tipo_cliente: String(cliente.tipo_cliente || '').toUpperCase(), tipo_documento: cliente.tipo_documento || '', genero: cliente.genero || '' });
      }
    }).catch((error) => {
      console.error('Error al obtener cliente:', error);
      if (activo) setErrorMessage('No se pudieron cargar los datos del cliente. Volvé al listado e intentá nuevamente.');
    }).finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [id]);

  const nombreCompleto = useMemo(() => `${formData.nombre || ''} ${formData.apellido || ''}`.trim(), [formData.nombre, formData.apellido]);
  const iniciales = useMemo(() => nombreCompleto.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join('') || 'CL', [nombreCompleto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((actual) => ({ ...actual, [e.target.name]: e.target.value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      await updateClient(id, formData);
      setSuccessModalOpen(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error al actualizar cliente', error);
      setErrorMessage(error?.response?.data?.message || 'No se pudieron guardar los cambios. Revisá los datos e intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    onClose?.();
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600';
  const fields = [
    { label: 'Nombre', name: 'nombre', placeholder: 'Nombre del cliente', icon: FiUser },
    { label: 'Apellido o razón social', name: 'apellido', placeholder: 'Apellido o empresa', icon: FiUser },
    { label: 'Documento', name: 'numDocumento', placeholder: 'Número de documento', icon: FiFileText },
    { label: 'Teléfono', name: 'telefono', placeholder: '+595 000 000000', icon: FiPhone },
    { label: 'Dirección', name: 'direccion', placeholder: 'Calle, número y ciudad', icon: FiMapPin },
    { label: 'Descripción', name: 'descripcion', placeholder: 'Nota interna (opcional)', icon: FiTag },
  ];

  return (
    <div className="min-h-[calc(100vh-220px)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[1680px] space-y-4">
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">{iniciales}</div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{nombreCompleto || 'Editar cliente'}</h2><span className="text-xs font-medium text-slate-400">Registro #{id}</span></div><p className="mt-0.5 text-sm text-slate-500">Datos del cliente</p></div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${formData.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><span className={`h-2 w-2 rounded-full ${formData.estado === 'activo' ? 'bg-emerald-500' : 'bg-slate-400'}`} />{formData.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
        </section>

        {errorMessage && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200"><span className="mt-0.5">!</span>{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300"><FiUser size={19} /></span>
              <div><h3 className="font-bold text-slate-900 dark:text-white">Información del cliente</h3><p className="mt-0.5 text-xs text-slate-500">Datos de identidad y contacto</p></div>
            </div>
            {loading ? <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">{Array.from({length: 6}).map((_, i) => <div key={i} className="h-[68px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div> : <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
              {fields.map(({label, name, placeholder, icon: Icon}) => <label key={name} className="block min-w-0">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Icon className="text-blue-500" />{label}</span>
                <input type="text" name={name} value={formData[name as keyof typeof formData] ?? ''} onChange={handleChange} className={inputClass} placeholder={placeholder} />
              </label>)}
            </div>}
            <div className="border-t border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"><FiTag size={18} /></span>
                <div><h3 className="font-bold text-slate-900 dark:text-white">Clasificación</h3><p className="mt-0.5 text-xs text-slate-500">Tipo de persona, cliente y documento</p></div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {selectFieldsConfig.map((field) => <label key={field.name} className="block min-w-0"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{field.placeholder.replace(/^Seleccione\s+/i, '')}</span><SelectInput name={field.name} value={String(formData[field.name as keyof typeof formData] ?? '')} onChange={handleChange} placeholder={field.placeholder} options={field.options} /></label>)}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="text-xs text-slate-500">Los cambios se aplicarán al guardar la ficha.</p>
              <button type="submit" disabled={loading || saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <FiSave size={17} />}
                {saving ? 'Guardando cambios…' : 'Guardar cambios'}
              </button>
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Vista previa</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-extrabold text-white">{iniciales}</div>
                <div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{nombreCompleto || 'Nombre del cliente'}</p><p className="truncate text-xs text-slate-500">{formData.numDocumento || 'Sin documento'}</p></div>
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Tipo de cliente</span><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">{formData.tipo_cliente || '—'}</span></div>
                <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Teléfono</span><span className="max-w-[150px] truncate font-semibold text-slate-700 dark:text-slate-200">{formData.telefono || '—'}</span></div>
                <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Documento</span><span className="max-w-[150px] truncate font-semibold text-slate-700 dark:text-slate-200">{formData.numDocumento || '—'}</span></div>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex gap-3"><span className="mt-0.5 text-emerald-600 dark:text-emerald-400"><FiCheckCircle size={18} /></span><div><p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Sugerencia</p><p className="mt-1 text-xs leading-5 text-emerald-800/80 dark:text-emerald-300/80">Actualiza los datos de contacto y el documento para facilitar futuras operaciones.</p></div></div>
            </div>
          </aside>
        </form>
      </div>
      <ModalSuccess isOpen={successModalOpen} onClose={handleSuccessClose} message="Cliente actualizado con éxito" />
    </div>
  );
};

export default EditarCliente;

