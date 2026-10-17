import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaPaperPlane, FaTimes, FaRedo } from 'react-icons/fa';
import MascotaTuki from '../guia/MascotaTuki';
import ProgresoIA from '../ProgresoIA';
import CreditosIABadge from '../CreditosIABadge';
import TarjetaProductoAsistente from './TarjetaProductoAsistente';
import { enviarMensajeAsistente, type MensajeAsistente, type TarjetaProducto } from '../../services/asistente';
import { mensajeErrorIA } from '../../services/creditosIA';
import { buscarCategoriaPorNombre } from '../../utils/buscarCategoriaPorNombre';

interface Burbuja extends MensajeAsistente {
  id: number;
  imagen?: string;
  tarjetas?: TarjetaProducto[];
  error?: boolean;
}

const CLAVE = 'asistente:conversacion';
export const CLAVE_PRECARGADO = 'asistente:productoPrecargado';
export const EVENTO_PRECARGADO = 'asistente:cargar-producto';

const SALUDO: Burbuja = {
  id: 0,
  rol: 'asistente',
  texto: '¡Hola! Soy Tuki 👋 Te ayudo a cargar productos, hacer compras y ventas.\n\nMandame el **nombre**, el **código de barras** o una **foto del envase** de un producto y te digo cómo conviene cargarlo.',
};

const SUGERENCIAS = [
  'Quiero cargar un medicamento nuevo',
  '¿Cómo vendo por blíster o por caja?',
  '¿Cómo registro una compra?',
  '¿Cómo abro la caja?',
];

const leer = (): Burbuja[] => {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    return Array.isArray(guardado) && guardado.length ? guardado : [SALUDO];
  } catch { return [SALUDO]; }
};

/** Reduce la foto a 1400 px (JPEG) antes de mandarla: más rápido y más barato, y alcanza para leer un envase. */
const reducirFoto = (archivo: File): Promise<{ base64: string; vista: string }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, 1400 / Math.max(img.width, img.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      lienzo.getContext('2d')?.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      const dataUrl = lienzo.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(',')[1], vista: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });

/** Texto del asistente: **negrita**, listas numeradas y saltos de línea (sin HTML). */
function Texto({ texto }: { texto: string }) {
  const lineas = texto.split('\n');
  const negrita = (t: string): ReactNode[] => t.split(/(\*\*[^*]+\*\*)/g).map((parte, i) => (parte.startsWith('**') && parte.endsWith('**') ? <strong key={i}>{parte.slice(2, -2)}</strong> : parte));
  return (
    <>
      {lineas.map((l, i) => {
        if (!l.trim()) return <div key={i} className="h-1.5" />;
        const num = l.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (num) return <p key={i} className="flex gap-1.5 pl-1"><span className="font-bold text-cyan-700 dark:text-cyan-300">{num[1]}.</span><span>{negrita(num[2])}</span></p>;
        return <p key={i}>{negrita(l)}</p>;
      })}
    </>
  );
}

/** Asistente Tuki: chat flotante para cargar productos, comprar y vender. Disponible en todas las pantallas. */
export default function AsistenteTuki() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [burbujas, setBurbujas] = useState<Burbuja[]>(leer);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<{ base64: string; vista: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const selector = useRef<HTMLInputElement>(null);
  const siguienteId = useRef(burbujas.reduce((m, b) => Math.max(m, b.id), 0) + 1);

  useEffect(() => {
    try { sessionStorage.setItem(CLAVE, JSON.stringify(burbujas.map(({ imagen, ...resto }) => resto).slice(-30))); } catch { /* sin almacenamiento */ }
  }, [burbujas]);
  useEffect(() => { if (abierto) fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [burbujas, enviando, abierto]);

  const adjuntar = async (archivo?: File | null) => {
    if (!archivo || !/^image\//.test(archivo.type)) return;
    try { setFoto(await reducirFoto(archivo)); } catch { /* imagen ilegible */ }
  };

  const enviar = useCallback(async (mensaje?: string) => {
    const contenido = (mensaje ?? texto).trim() || (foto ? 'Mirá esta foto: ¿cómo conviene cargar este producto?' : '');
    if (!contenido || enviando) return;
    const fotoEnviada = foto;
    const nueva: Burbuja = { id: siguienteId.current++, rol: 'usuario', texto: contenido, imagen: fotoEnviada?.vista };
    const historial = [...burbujas.filter((b) => !b.error), nueva];
    setBurbujas(historial);
    setTexto('');
    setFoto(null);
    setEnviando(true);
    try {
      const r = await enviarMensajeAsistente(historial.map(({ rol, texto: t }) => ({ rol, texto: t })), fotoEnviada?.base64);
      if (!r.success) throw new Error(r.error || 'Tuki no pudo responder.');
      setBurbujas((b) => [...b, { id: siguienteId.current++, rol: 'asistente', texto: r.respuesta || '', tarjetas: r.tarjetas }]);
    } catch (err) {
      setBurbujas((b) => [...b, { id: siguienteId.current++, rol: 'asistente', error: true, texto: mensajeErrorIA(err, 'Tuki no pudo responder en este momento. Probá de nuevo.') }]);
    } finally {
      setEnviando(false);
    }
  }, [texto, foto, enviando, burbujas]);

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar(); }
  };
  const alPegar = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const archivo = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (archivo) { e.preventDefault(); void adjuntar(archivo); }
  };

  const cargarProducto = async (t: TarjetaProducto) => {
    const d = t.datos; const p = d.producto; const c = d.como_cargar;
    if (!p || !c) return;
    const categoria = await buscarCategoriaPorNombre(c.categoria_sugerida);
    const precargado = {
      producto: {
        nombre_producto: p.nombre,
        marca: p.marca,
        contenido_neto: p.contenido,
        categoria_sugerida: c.categoria_sugerida,
        unidad_medida_sugerida: c.unidad_medida,
        unidades_por_presentacion: c.unidades_por_caja,
        unidades_por_pack: c.unidades_por_pack,
        fuente_presentacion: c.verificado ? 'web' : null,
        cod_barra: p.cod_barra,
        principio_activo: p.principio_activo,
      },
      categoria,
    };
    try { sessionStorage.setItem(CLAVE_PRECARGADO, JSON.stringify(precargado)); } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new Event(EVENTO_PRECARGADO));
    navigate('/productos/nuevo');
    setAbierto(false);
  };

  const reiniciar = () => { setBurbujas([SALUDO]); siguienteId.current = 1; setFoto(null); setTexto(''); };
  const soloSaludo = burbujas.length === 1;

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir el asistente Tuki"
          title="Preguntale a Tuki cómo cargar un producto, comprar o vender"
          className="fixed bottom-4 right-4 z-[65] flex items-center gap-2 rounded-full border border-cyan-300/60 bg-slate-900 py-1 pl-1 pr-4 text-sm font-bold text-white shadow-2xl hover:bg-slate-800"
        >
          <MascotaTuki feliz compact /> Asistente
        </button>
      )}

      {abierto && (
        <section aria-label="Asistente Tuki" className="fixed bottom-4 right-4 z-[70] flex h-[min(640px,calc(100vh-2rem))] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-cyan-300/40 bg-slate-50 shadow-2xl dark:bg-slate-950">
          <header className="flex items-center gap-2 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-3 py-2 text-white">
            <div className="-my-1 shrink-0"><MascotaTuki feliz compact /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold leading-tight">Tuki · Asistente</p>
              <p className="text-[10px] text-cyan-100/80">Productos, compras y ventas</p>
            </div>
            <button type="button" onClick={reiniciar} aria-label="Nueva conversación" title="Nueva conversación" className="rounded-lg p-2 text-cyan-100/80 hover:bg-white/10 hover:text-white"><FaRedo size={12} /></button>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar el asistente" className="rounded-lg p-2 text-cyan-100/80 hover:bg-white/10 hover:text-white"><FaTimes size={13} /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
            {burbujas.map((b) => (
              <div key={b.id} className={`flex ${b.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm ${b.rol === 'usuario' ? 'rounded-br-sm bg-blue-600 text-white' : b.error ? 'rounded-bl-sm border border-red-200 bg-red-50 text-red-800' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
                  {b.imagen && <img src={b.imagen} alt="Foto enviada" className="mb-1.5 max-h-40 rounded-lg" />}
                  <Texto texto={b.texto} />
                  {b.tarjetas?.map((t, i) => (
                    <TarjetaProductoAsistente key={i} tarjeta={t} onCargar={(x) => void cargarProducto(x)} onVerInventario={() => { navigate('/productos'); setAbierto(false); }} />
                  ))}
                </div>
              </div>
            ))}

            {soloSaludo && !enviando && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" onClick={() => void enviar(s)} className="rounded-full border border-cyan-300 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-50 dark:bg-slate-900 dark:text-cyan-200">{s}</button>
                ))}
              </div>
            )}

            {enviando && <ProgresoIA />}
            <div ref={fin} />
          </div>

          <footer className="border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            {foto && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
                <img src={foto.vista} alt="Foto adjunta" className="h-12 w-12 rounded object-cover" />
                <span className="flex-1 text-xs text-slate-600 dark:text-slate-300">Foto lista para enviar</span>
                <button type="button" onClick={() => setFoto(null)} aria-label="Quitar la foto" className="rounded p-1.5 text-slate-500 hover:bg-slate-200"><FaTimes size={11} /></button>
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <input ref={selector} type="file" accept="image/*" className="hidden" onChange={(e) => { void adjuntar(e.target.files?.[0]); e.target.value = ''; }} />
              <button type="button" onClick={() => selector.current?.click()} aria-label="Adjuntar una foto del envase" title="Foto del envase" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><FaCamera size={15} /></button>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={alTeclear}
                onPaste={alPegar}
                rows={1}
                placeholder="Nombre, código de barras o pregunta…"
                aria-label="Escribí tu mensaje"
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button type="button" onClick={() => void enviar()} disabled={enviando || (!texto.trim() && !foto)} aria-label="Enviar" className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-40"><FaPaperPlane size={15} /></button>
            </div>
            <CreditosIABadge tipo="chat" className="mt-1.5" />
          </footer>
        </section>
      )}
    </>
  );
}
