import { useState } from 'react';
import { FaBarcode } from 'react-icons/fa';
import { generarCodigoBarra } from '../services/productos';

interface Props {
  /** Recibe el código generado para ponerlo en el campo. */
  onCodigo: (codigo: string) => void;
  /** Códigos que el formulario ya generó o cargó pero todavía no se guardaron (para no repetirlos). */
  evitar?: string[];
  className?: string;
}

/**
 * Botón "Generar" junto al campo de código de barras: el sistema asigna un código EAN-13 interno, correlativo y sin repetir,
 * para los productos que no traen código de fábrica (el usuario puede imprimirlo o pegarlo como etiqueta).
 */
export default function BotonGenerarCodigoBarra({ onCodigo, evitar = [], className = '' }: Props) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const generar = async () => {
    setCargando(true);
    setError('');
    try {
      const r = await generarCodigoBarra(evitar);
      onCodigo(String(r.data?.codigo || ''));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo generar el código. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={generar}
        disabled={cargando}
        title="El sistema le asigna un código de barras propio a este producto"
        className={`flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:bg-gray-300 ${className}`}
      >
        <FaBarcode size={13} aria-hidden="true" /> {cargando ? '...' : 'Generar'}
      </button>
      {error && <span role="alert" className="basis-full text-xs font-medium text-rose-600">{error}</span>}
    </>
  );
}
