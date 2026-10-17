import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { getLogoFacturador, subirLogoFacturador, eliminarLogoFacturador, urlLogo, type LogoEmpresa, type ModoFondo } from '../services/logoEmpresa';

const MAX_MB = 6;

export interface LogoPendiente { archivo: File; fondo: ModoFondo }

/** Muestra el logo dentro de una caja fija, igual que en las plantillas: nunca se estira ni se corta. */
function CajaLogo({ src, ancho, alto, className = '' }: { src: string; ancho: number; alto: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: ancho, height: alto }}>
      <img src={src} alt="Logo de la empresa" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  );
}

function Vista({ titulo, children, pie }: { titulo: string; children: React.ReactNode; pie: string }) {
  return (
    <figure className="m-0">
      <figcaption className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{titulo}</figcaption>
      {children}
      <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{pie}</p>
    </figure>
  );
}

interface Props {
  /** Facturador al que pertenece el logo. Sin id (facturador nuevo) el archivo queda pendiente y se sube al guardar. */
  idfacturador?: number | string | null;
  /** Solo en facturador nuevo: avisa al formulario qué archivo subir cuando se cree. */
  onPendienteChange?: (pendiente: LogoPendiente | null) => void;
}

/**
 * Logo de la empresa dentro del facturador (donde se cargan los datos de la empresa). Se usa en tickets, facturas,
 * comprobantes, reportes y flyers: se sube una vez y el servidor lo deja estandarizado.
 */
export default function LogoFacturador({ idfacturador, onPendienteChange }: Props) {
  const modoNuevo = !idfacturador;
  const [logo, setLogo] = useState<LogoEmpresa>({ tiene: false });
  const [pendienteUrl, setPendienteUrl] = useState('');
  const [archivoPend, setArchivoPend] = useState<File | null>(null);
  const [cargando, setCargando] = useState(!modoNuevo);
  const [subiendo, setSubiendo] = useState(false);
  const [fondo, setFondo] = useState<ModoFondo>('auto');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    if (!idfacturador) return;
    try {
      const { data } = await getLogoFacturador(idfacturador);
      setLogo(data);
    } catch {
      setLogo({ tiene: false });
    } finally {
      setCargando(false);
    }
  }, [idfacturador]);
  useEffect(() => { void cargar(); }, [cargar]);
  useEffect(() => () => { if (pendienteUrl) URL.revokeObjectURL(pendienteUrl); }, [pendienteUrl]);
  // Facturador nuevo: el formulario siempre sabe qué archivo y qué modo de fondo subir al guardar.
  useEffect(() => { if (modoNuevo) onPendienteChange?.(archivoPend ? { archivo: archivoPend, fondo } : null); }, [modoNuevo, archivoPend, fondo]); // eslint-disable-line react-hooks/exhaustive-deps

  const validar = (archivo: File): string | null => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(archivo.type)) return 'Subí tu logo en PNG, JPG o WEBP.';
    if (archivo.size > MAX_MB * 1024 * 1024) return `La imagen pesa más de ${MAX_MB} MB. Probá con una más liviana.`;
    return null;
  };

  const elegir = async (archivo: File | undefined | null) => {
    if (!archivo) return;
    setMensaje(null); setAvisos([]);
    const problema = validar(archivo);
    if (problema) { setMensaje({ tipo: 'error', texto: problema }); return; }

    if (modoNuevo) {
      // Facturador todavía sin guardar: se muestra tal cual y se sube (y estandariza) al crearlo.
      setPendienteUrl(URL.createObjectURL(archivo));
      setArchivoPend(archivo);
      setMensaje({ tipo: 'ok', texto: 'Listo: el logo se guarda y se ajusta solo cuando guardes el facturador.' });
      return;
    }

    setSubiendo(true);
    try {
      const { data } = await subirLogoFacturador(idfacturador!, archivo, fondo);
      setLogo(data);
      setAvisos(data.avisos || []);
      setMensaje({ tipo: 'ok', texto: data.fondoQuitado ? 'Logo guardado. Le quitamos el fondo blanco para que se vea limpio en los documentos.' : 'Logo guardado.' });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || err.response?.data?.message || 'No se pudo guardar el logo.' });
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = '';
    }
  };

  const quitar = async () => {
    setMensaje(null); setAvisos([]);
    if (modoNuevo) {
      setPendienteUrl('');
      setArchivoPend(null);
      if (entrada.current) entrada.current.value = '';
      return;
    }
    try {
      await eliminarLogoFacturador(idfacturador!);
      setLogo({ tiene: false });
      setMensaje({ tipo: 'ok', texto: 'Logo eliminado. Los documentos volverán a salir solo con el nombre de la empresa.' });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo eliminar el logo.' });
    }
  };

  const hayLogo = modoNuevo ? !!pendienteUrl : logo.tiene;
  const color = modoNuevo ? pendienteUrl : urlLogo(logo.url);
  const mono = modoNuevo ? pendienteUrl : urlLogo(logo.urlMono);

  return (
    <section aria-label="Logo de la empresa" className="md:col-span-3 rounded-lg border border-blue-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">Logo de la empresa</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${hayLogo ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
          {cargando ? 'Cargando…' : hayLogo ? (modoNuevo ? 'Elegido' : 'Cargado') : 'Sin logo'}
        </span>
      </div>
      <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
        Opcional. Aparece en tus tickets, facturas, comprobantes, reportes y flyers. Subí el archivo como lo tengas (PNG o JPG): el sistema lo recorta, le quita el fondo blanco y lo ajusta solo para que quede prolijo en todos los documentos.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); void elegir(e.dataTransfer.files?.[0]); }}
            className={`flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${arrastrando ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/40'}`}
          >
            {hayLogo && color ? (
              <CajaLogo src={color} ancho={240} alto={96} className="rounded-lg bg-white" />
            ) : (
              <FaCloudUploadAlt className="text-3xl text-gray-400" aria-hidden="true" />
            )}
            <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void elegir(e.target.files?.[0])} />
            <button type="button" disabled={subiendo} onClick={() => entrada.current?.click()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {subiendo ? 'Procesando…' : hayLogo ? 'Cambiar logo' : 'Elegir logo'}
            </button>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">o arrastralo hasta acá · PNG, JPG o WEBP · hasta {MAX_MB} MB</span>
          </div>

          <label className="mt-3 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Fondo del logo
            <select value={fondo} onChange={(e) => setFondo(e.target.value as ModoFondo)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="auto">Automático (quita el fondo si es blanco)</option>
              <option value="quitar">Quitar el fondo blanco</option>
              <option value="mantener">Mantener el fondo como está</option>
            </select>
            <span className="mt-1 block text-[11px] font-normal text-gray-500 dark:text-gray-400">Se aplica al elegir el archivo.</span>
          </label>

          {hayLogo && (
            <button type="button" onClick={() => void quitar()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30">
              <FaTrash aria-hidden="true" /> Quitar el logo
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Así se va a ver</p>
          {hayLogo && color ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Vista titulo="Factura / comprobante A4" pie="Arriba y centrado, a color.">
                <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                  <CajaLogo src={color} ancho={140} alto={54} className="mx-auto" />
                  <div className="mx-auto mt-1 h-2 w-24 rounded bg-gray-300" />
                  <div className="mx-auto mt-1.5 h-1.5 w-16 rounded bg-gray-200" />
                  <div className="mt-3 space-y-1"><div className="h-1.5 rounded bg-gray-200" /><div className="h-1.5 rounded bg-gray-200" /><div className="h-1.5 w-3/4 rounded bg-gray-200" /></div>
                </div>
              </Vista>
              <Vista titulo="Ticket térmico" pie="En blanco y negro nítido, para que salga bien en impresoras de rollo.">
                <div className="mx-auto w-36 rounded-sm border border-gray-200 bg-white p-2 shadow-sm">
                  <CajaLogo src={mono} ancho={112} alto={44} className="mx-auto" />
                  <div className="mx-auto mt-1 h-1.5 w-20 rounded bg-gray-300" />
                  <div className="mt-2 space-y-1"><div className="h-1 rounded bg-gray-200" /><div className="h-1 rounded bg-gray-200" /><div className="h-1 w-2/3 rounded bg-gray-200" /></div>
                </div>
              </Vista>
              <Vista titulo="Flyer de oferta" pie="En una pastilla blanca arriba a la derecha, sobre cualquier plantilla.">
                <div className="relative h-32 overflow-hidden rounded-md bg-gradient-to-br from-amber-100 to-orange-200 shadow-sm">
                  <div className="absolute right-2 top-2 rounded-lg bg-white/95 p-1 shadow">
                    <CajaLogo src={color} ancho={64} alto={26} />
                  </div>
                  <div className="absolute bottom-3 left-3 space-y-1"><div className="h-2.5 w-20 rounded bg-gray-800/80" /><div className="h-4 w-24 rounded bg-red-600/80" /></div>
                </div>
              </Vista>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Cuando elijas tu logo, acá vas a ver cómo queda en una factura, en un ticket y en un flyer.
            </div>
          )}

          <ul className="mt-4 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
            <li className="flex gap-1.5"><FaInfoCircle className="mt-0.5 shrink-0" aria-hidden="true" /> Lo mejor es un PNG con fondo transparente o un JPG con fondo blanco, de al menos 400 píxeles de ancho.</li>
            <li className="flex gap-1.5"><FaInfoCircle className="mt-0.5 shrink-0" aria-hidden="true" /> Un logo horizontal (tipo 3:1) o cuadrado se ve mejor que uno muy alargado.</li>
          </ul>
        </div>
      </div>

      {avisos.map((a) => (
        <p key={a} className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" role="status">{a}</p>
      ))}
      {mensaje && (
        <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>{mensaje.texto}</p>
      )}
    </section>
  );
}
