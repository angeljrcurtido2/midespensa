/**
 * Resalta en pantalla los campos que faltan o están mal: recuadro rojo, un pequeño temblor y desplazamiento hasta
 * el primero. El resalte se quita solo cuando la persona toca o cambia ese campo.
 *
 * Los estilos están en globals.css ([data-invalido="true"]). Funciona con cualquier elemento: inputs, selects o
 * botones (por ejemplo el de "Seleccionar categoría").
 */
const ATRIBUTO = 'data-invalido';

const visible = (e: Element) => (e as HTMLElement).getClientRects().length > 0;

/** Busca el elemento de un campo: por selector CSS o por `data-campo`. Prefiere el que está a la vista. */
export const buscarCampo = (clave: string, raiz: ParentNode = document): HTMLElement | null => {
  const porAtributo = [...raiz.querySelectorAll<HTMLElement>('[data-campo]')].filter((e) => e.getAttribute('data-campo') === clave);
  let candidatos = porAtributo;
  if (!candidatos.length) {
    // No es un `data-campo`: se toma como selector CSS (si no es válido, simplemente no se encuentra).
    try { candidatos = [...raiz.querySelectorAll<HTMLElement>(clave)]; } catch { candidatos = []; }
  }
  return candidatos.find(visible) ?? candidatos[0] ?? null;
};

export const limpiarInvalidos = (raiz: ParentNode = document) => {
  raiz.querySelectorAll(`[${ATRIBUTO}]`).forEach((e) => e.removeAttribute(ATRIBUTO));
};

/**
 * Marca como inválidos los elementos indicados (claves `data-campo` o selectores CSS), baja la pantalla hasta el
 * primero y le da el foco. Devuelve cuántos encontró.
 */
export const resaltarCampos = (claves: string[], opciones: { raiz?: ParentNode; enfocar?: boolean } = {}): number => {
  const { raiz = document, enfocar = true } = opciones;
  limpiarInvalidos(raiz);
  const elementos = claves.map((c) => buscarCampo(c, raiz)).filter((e): e is HTMLElement => !!e);
  elementos.forEach((e) => {
    e.setAttribute(ATRIBUTO, 'true');
    // Reinicia la animación aunque el campo ya estuviera marcado.
    e.style.animation = 'none'; void e.offsetWidth; e.style.animation = '';
  });
  const primero = elementos[0];
  if (primero) {
    primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (enfocar) window.setTimeout(() => primero.focus?.({ preventScroll: true }), 350);
  }
  return elementos.length;
};

let iniciado = false;

/**
 * Una sola vez al arrancar: (1) los campos `required` que el navegador marca como inválidos al enviar un
 * formulario también se resaltan; (2) el resalte se quita al escribir, elegir o tocar el campo.
 */
export const iniciarResaltadoDeCampos = () => {
  if (iniciado || typeof document === 'undefined') return;
  iniciado = true;

  document.addEventListener('invalid', (e) => {
    const campo = e.target as HTMLElement;
    campo.setAttribute(ATRIBUTO, 'true');
    campo.style.animation = 'none'; void campo.offsetWidth; campo.style.animation = '';
  }, true);

  const quitar = (e: Event) => {
    const marcado = (e.target as HTMLElement | null)?.closest?.(`[${ATRIBUTO}]`);
    if (marcado) marcado.removeAttribute(ATRIBUTO);
  };
  ['input', 'change', 'click'].forEach((tipo) => document.addEventListener(tipo, quitar, true));
};
