import { useEffect } from 'react';

/**
 * En el celular las tablas anchas (cajas, arqueos, pagos de la licencia…) obligaban a deslizar de costado y se veían cortadas.
 * Este gancho marca cada tabla con encabezado (`tabla-movil`) y le pone a cada celda el nombre de su columna (`data-label`);
 * despensa.css las muestra como tarjetas debajo de 768 px. En pantallas grandes no cambia nada.
 */
export function useTablasMovil() {
  useEffect(() => {
    const marcar = () => {
      document.querySelectorAll<HTMLTableElement>('table').forEach((t) => {
        if (t.classList.contains('lineas-venta')) return; // esta tabla tiene su propio diseño de tarjetas
        const ths = Array.from(t.querySelectorAll('thead th')).map((th) => {
          const solo = th.querySelector('.sr-only');
          return solo && (th.textContent || '').trim() === (solo.textContent || '').trim() ? '' : (th.textContent || '').trim();
        });
        if (!ths.length) return;
        t.classList.add('tabla-movil');
        t.querySelectorAll('tbody tr').forEach((tr) => {
          let col = 0;
          Array.from(tr.children).forEach((celda) => {
            if (!celda.hasAttribute('data-label')) celda.setAttribute('data-label', ths[col] ?? '');
            col += Number(celda.getAttribute('colspan')) || 1;
          });
        });
      });
    };
    let espera: number | undefined;
    const observador = new MutationObserver(() => { window.clearTimeout(espera); espera = window.setTimeout(marcar, 120); });
    observador.observe(document.body, { childList: true, subtree: true });
    marcar();
    return () => { observador.disconnect(); window.clearTimeout(espera); };
  }, []);
}
