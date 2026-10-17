import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

interface Props {
  src: string;
  alt: string;
  /** Tamaño de la miniatura en el listado (clases de Tailwind de alto y ancho). */
  tamano?: string;
  /** Texto que se muestra debajo de la imagen ampliada (por ejemplo el nombre del producto). */
  leyenda?: string;
}

/** Miniatura que se abre en grande al tocarla: foto del producto visible sin salir del listado. */
export default function ImagenAmpliable({ src, alt, tamano = 'h-16 w-16', leyenda }: Props) {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false); };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [abierta]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setAbierta(true); }}
        aria-label={`Ver la foto de ${alt} en grande`}
        title="Tocar para ver en grande"
        className={`${tamano} group relative shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
      >
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
      </button>
      {abierta && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${alt}`}
          onClick={() => setAbierta(false)}
          onDoubleClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/75 p-4"
        >
          <figure className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt} className="max-h-[80vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl" />
            {leyenda && <figcaption className="mt-3 text-center text-base font-bold text-white">{leyenda}</figcaption>}
            <button type="button" onClick={() => setAbierta(false)} aria-label="Cerrar" className="absolute -right-3 -top-3 rounded-full bg-white p-2.5 text-slate-700 shadow-lg hover:bg-slate-100">
              <FaTimes />
            </button>
          </figure>
        </div>,
        document.body,
      )}
    </>
  );
}
