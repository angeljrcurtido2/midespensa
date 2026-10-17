import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheck, FaTimes } from 'react-icons/fa';
import MascotaTuki from './MascotaTuki';
import { VentanaActivaContext } from '../../hooks/useAlVolverALaVentana';

/**
 * Guía paso a paso de Tuki para una pantalla (Nueva venta, Nueva compra, Nuevo producto).
 * Cada paso resalta el campo o botón donde hay que actuar y explica qué hacer; si el paso trae `listo`, avanza solo cuando
 * la persona lo cumple. Se puede abrir cuando se quiera con el botón "Guíame" y se sale en cualquier momento.
 *
 * `destino` indica el elemento a resaltar:
 *   "css:<selector>"   primer elemento visible que coincide
 *   "label:<texto>"    el campo (input/select/botón) que sigue a la etiqueta con ese texto
 *   "boton:<texto>"    el botón visible cuyo texto contiene ese texto
 *   sin destino        el paso solo explica
 */
const MASCOTA_ACTIVA = false;

export interface PasoGuia {
  id: string;
  destino?: string;
  titulo: string;
  texto: string;
  /** true cuando la persona ya cumplió el paso (avanza solo). */
  listo?: boolean;
  /** Alternativa a `listo` para pantallas cuyo estado no está a mano: se consulta cada medio segundo sobre lo que se ve en pantalla. */
  comprobar?: () => boolean;
}

const visible = (e: Element | null): e is HTMLElement => !!e && (e as HTMLElement).getClientRects().length > 0;

const normaliza = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

export const resolverDestino = (destino?: string): HTMLElement | null => {
  if (!destino) return null;
  const [tipo, ...resto] = destino.split(':');
  const valor = resto.join(':');
  if (tipo === 'css') return [...document.querySelectorAll(valor)].find(visible) ?? null;
  if (tipo === 'boton') {
    const q = normaliza(valor);
    return ([...document.querySelectorAll('button')].find((b) => visible(b) && normaliza(b.textContent || '').includes(q)) as HTMLElement) ?? null;
  }
  if (tipo === 'label') {
    const q = normaliza(valor);
    const etiqueta = [...document.querySelectorAll('label, p, span, h3, h4, div')].find((e) => {
      if (!visible(e) || e.children.length > 2 || e.closest('[aria-label^="Guía de Tuki"], [aria-label="Invitación de Tuki"]')) return false;
      const t = normaliza(e.textContent || '');
      return t.includes(q) && t.length <= q.length + 14;
    });
    if (!etiqueta) return null;
    const dentro = etiqueta.querySelector<HTMLElement>('input, select, textarea, button');
    if (dentro && visible(dentro)) return dentro;
    // El campo suele estar en un hermano de la etiqueta o de alguno de sus contenedores.
    for (let nodo: Element | null = etiqueta; nodo && nodo !== document.body; nodo = nodo.parentElement) {
      let sig = nodo.nextElementSibling;
      while (sig) {
        const campo = sig.matches('input, select, textarea, button') ? (sig as HTMLElement) : sig.querySelector<HTMLElement>('input, select, textarea, button');
        if (campo && visible(campo)) return campo;
        sig = sig.nextElementSibling;
      }
    }
  }
  return null;
};

interface PropsGuia {
  pasos: PasoGuia[];
  /** Nombre corto de la guía, por ejemplo "venta". */
  nombre: string;
  onCerrar: (completada: boolean) => void;
}

/** Panel de la guía abierta + resaltado del campo del paso actual. */
export function GuiaTuki({ pasos, nombre, onCerrar }: PropsGuia) {
  const ventanaActiva = useContext(VentanaActivaContext);
  const [indice, setIndice] = useState(0);
  // El cumplimiento medido en pantalla se guarda junto con el paso al que corresponde (evita arrastrar el del paso anterior).
  const [cumplido, setCumplido] = useState<{ id: string; ok: boolean }>({ id: '', ok: false });
  const avanzadoPor = useRef<string | null>(null);
  const pasoBase = pasos[Math.min(indice, pasos.length - 1)];
  const paso = { ...pasoBase, listo: pasoBase.listo || (cumplido.id === pasoBase.id && cumplido.ok) };
  const ultimo = indice >= pasos.length - 1;

  const siguiente = useCallback(() => setIndice((i) => Math.min(i + 1, pasos.length - 1)), [pasos.length]);

  // Resalta el campo del paso (se vuelve a buscar mientras tanto: algunos aparecen recién cuando se agrega un producto).
  useEffect(() => {
    if (!ventanaActiva) return;
    let actual: HTMLElement | null = null;
    const limpiar = () => { if (actual) { actual.style.outline = ''; actual.style.outlineOffset = ''; actual.style.boxShadow = ''; actual.style.borderRadius = actual.dataset.tukiRadio ?? ''; } };
    const aplicar = (scroll: boolean) => {
      const nuevo = resolverDestino(paso.destino);
      if (nuevo === actual) return;
      limpiar();
      actual = nuevo;
      if (!actual) return;
      actual.dataset.tukiRadio = actual.style.borderRadius;
      actual.style.outline = '3px solid #10b981';
      actual.style.outlineOffset = '3px';
      actual.style.boxShadow = '0 0 0 7px rgba(16,185,129,.18)';
      if (scroll) actual.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    aplicar(true);
    const t = setInterval(() => {
      aplicar(false);
      if (pasoBase.comprobar) { try { const ok = !!pasoBase.comprobar(); setCumplido((c) => (c.id === pasoBase.id && c.ok === ok ? c : { id: pasoBase.id, ok })); } catch { /* el campo todavía no existe */ } }
    }, 500);
    return () => { clearInterval(t); limpiar(); };
  }, [paso.id, paso.destino, ventanaActiva]); // eslint-disable-line react-hooks/exhaustive-deps


  // Avanza solo cuando la persona cumple el paso.
  useEffect(() => {
    if (!paso.listo || ultimo || avanzadoPor.current === paso.id) return;
    const t = setTimeout(() => { avanzadoPor.current = paso.id; siguiente(); }, 1100);
    return () => clearTimeout(t);
  }, [paso.listo, paso.id, ultimo, siguiente]);

  useEffect(() => {
    const salir = (e: KeyboardEvent) => { if (e.key === 'Escape' && ventanaActiva) onCerrar(false); };
    window.addEventListener('keydown', salir);
    return () => window.removeEventListener('keydown', salir);
  }, [onCerrar, ventanaActiva]);

  if (!ventanaActiva) return null;
  return (
    <section
      aria-label={`Guía de Tuki: ${nombre}`}
      className="fixed bottom-4 left-4 z-[60] w-[min(430px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 text-white shadow-2xl md:left-28"
    >
      <div className="flex items-start gap-3">
        <div className="-mt-1 shrink-0"><MascotaTuki feliz={paso.listo || ultimo} compact /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">Tuki · guía de {nombre}</p>
            <button type="button" onClick={() => onCerrar(false)} className="rounded-lg p-1.5 text-cyan-100/80 hover:bg-white/10 hover:text-white" aria-label="Salir de la guía" title="Salir de la guía (Esc)"><FaTimes size={13} /></button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={paso.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <h3 className="mt-1 text-lg font-extrabold leading-tight">{paso.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">{paso.texto}</p>
              {paso.listo && <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-lime-300" role="status"><FaCheck size={11} /> ¡Listo!</p>}
            </motion.div>
          </AnimatePresence>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300 transition-all" style={{ width: `${((indice + 1) / pasos.length) * 100}%` }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-cyan-100/70">Paso {indice + 1} de {pasos.length}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIndice((i) => Math.max(0, i - 1))} disabled={indice === 0} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-30">Anterior</button>
              {ultimo ? (
                <button type="button" onClick={() => onCerrar(true)} className="rounded-lg bg-lime-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-900 hover:bg-lime-300">¡Terminé!</button>
              ) : (
                <button type="button" onClick={siguiente} className="rounded-lg bg-cyan-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-900 hover:bg-cyan-300">Siguiente</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Estado de una guía: si está abierta y si ya se ofreció a la persona (se acuerda en el navegador). */
export function useGuiaTuki(clave: string) {
  const llave = `tuki:${clave}`;
  const leer = () => { try { return localStorage.getItem(llave); } catch { return null; } };
  const [abierta, setAbierta] = useState(false);
  const [estado, setEstado] = useState<string | null>(leer);
  const marcar = (valor: 'completada' | 'rechazada') => { try { localStorage.setItem(llave, valor); } catch { /* sin almacenamiento */ } setEstado(valor); };
  return {
    abierta,
    /** Primera vez: se muestra la invitación. */
    invitar: estado === null && !abierta,
    abrir: () => setAbierta(true),
    cerrar: (completada: boolean) => { setAbierta(false); marcar(completada ? 'completada' : 'rechazada'); },
    rechazarInvitacion: () => marcar('rechazada'),
  };
}

/** Botón flotante "Guíame" (con invitación la primera vez). */
export function BotonTuki({ nombre, invitar, onAbrir, onRechazar }: { nombre: string; invitar: boolean; onAbrir: () => void; onRechazar: () => void }) {
  const ventanaActiva = useContext(VentanaActivaContext);
  // Versión gratuita: sin mascota (es de la marca del sistema de pago).
  if (!ventanaActiva || !MASCOTA_ACTIVA) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[55] flex items-end gap-2 md:left-28">
      {invitar && (
        <div role="dialog" aria-label="Invitación de Tuki" className="max-w-[260px] rounded-2xl border border-cyan-300/40 bg-slate-900 p-3 text-sm text-white shadow-xl">
          <p className="font-bold">¡Hola! Soy Tuki 👋</p>
          <p className="mt-1 text-slate-200">¿Querés que te guíe paso a paso en {nombre}?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onAbrir} className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-extrabold text-slate-900 hover:bg-cyan-300">Sí, guiame</button>
            <button type="button" onClick={onRechazar} className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">No, gracias</button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onAbrir}
        title={`Tuki te guía paso a paso en ${nombre}`}
        className="flex items-center gap-2 rounded-full border border-cyan-300/50 bg-slate-900 py-1 pl-1 pr-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800"
      >
        <MascotaTuki feliz compact /> Guíame
      </button>
    </div>
  );
}
