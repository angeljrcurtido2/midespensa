'use client';

interface BotonCerrarModalProps {
  onClose: () => void;
  /** Texto del aria-label, por si el modal necesita uno más específico. */
  label?: string;
}

/**
 * Botón de cierre (X) para los modales.
 *
 * Varios modales sólo se podían cerrar haciendo clic fuera del panel o con
 * Escape, algo que muchos usuarios no descubren: quedaban atrapados en la
 * pantalla sin una salida visible.
 *
 * Va dentro de un contenedor `sticky` y no `absolute` porque los paneles tienen
 * overflow-auto: con posicionamiento absoluto el botón se desplazaba con el
 * scroll y desaparecía al bajar en formularios largos.
 */
const BotonCerrarModal = ({ onClose, label = 'Cerrar' }: BotonCerrarModalProps) => (
  <div className="sticky top-0 z-20 flex justify-end -mb-2 pointer-events-none">
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      title={label}
      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-700/90 text-gray-500 dark:text-gray-200 shadow-md ring-1 ring-gray-200 dark:ring-gray-600 backdrop-blur transition-colors hover:bg-red-500 hover:text-white hover:ring-red-500"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  </div>
);

export default BotonCerrarModal;
