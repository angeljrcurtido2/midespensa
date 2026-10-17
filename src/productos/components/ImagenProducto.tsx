import { useEffect, useRef, useState } from 'react';
import { FaCamera, FaTrash, FaImage } from 'react-icons/fa';
import { getProductoById, subirImagenProducto, eliminarImagenProducto, urlImagenProducto } from '../../services/productos';

/** Foto del producto: se sube apenas se elige el archivo (el servidor la achica y la guarda como WEBP). */
export default function ImagenProducto({ id }: { id: number | string }) {
  const [imagen, setImagen] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProductoById(id).then((r) => setImagen(r.data?.imagen || null)).catch(() => setImagen(null));
  }, [id]);

  const avisar = () => window.dispatchEvent(new Event('producto:imagen'));

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (archivo.size > 8 * 1024 * 1024) { setError('La imagen supera los 8 MB'); return; }
    setError(''); setCargando(true);
    try {
      const r = await subirImagenProducto(id, archivo);
      setImagen(r.data.imagen);
      avisar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo subir la imagen');
    } finally { setCargando(false); }
  };

  const quitar = async () => {
    setError(''); setCargando(true);
    try { await eliminarImagenProducto(id); setImagen(null); avisar(); }
    catch (err: any) { setError(err.response?.data?.message || 'No se pudo quitar la imagen'); }
    finally { setCargando(false); }
  };

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/70">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><FaCamera /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Foto del producto</p>
          <p className="text-xs text-slate-500">Imagen que se muestra en el listado y la publicidad</p>
        </div>
      </header>
      <div className="grid grid-cols-1 items-center gap-3 p-3 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:gap-4 sm:px-4 2xl:grid-cols-1 2xl:justify-items-start">
        <div className="flex h-[60px] w-[76px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
          {imagen ? <img src={urlImagenProducto(imagen)} alt="Foto del producto" className="h-full w-full object-contain" /> : <FaImage className="text-xl text-slate-300" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{imagen ? 'Imagen cargada' : 'No hay una imagen seleccionada'}</p>
          <p className="mt-0.5 text-xs text-slate-500">JPG, PNG o WEBP. Tamano maximo: 8 MB.</p>
          {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
        </div>
        <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={elegir} />
        <div className="flex items-center gap-2 sm:justify-self-end 2xl:justify-self-start">
          <button type="button" disabled={cargando} onClick={() => entrada.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
            <FaCamera /> {cargando ? 'Subiendo...' : imagen ? 'Cambiar foto' : 'Seleccionar imagen'}
          </button>
          {imagen && <button type="button" disabled={cargando} onClick={quitar} aria-label="Quitar foto del producto" title="Quitar foto" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"><FaTrash /></button>}
        </div>
      </div>
    </section>
  );
}
