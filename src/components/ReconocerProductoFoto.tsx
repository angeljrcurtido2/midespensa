'use client';

import { useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import {
  reconocerProductoDetallado,
  type ProductoDetectado,
  type ProductoCoincidente,
} from '../services/reconocimiento';
import { buscarCategoriaPorNombre, type CategoriaEncontrada } from '../utils/buscarCategoriaPorNombre';
import { mensajeErrorIA } from '../services/creditosIA';
import { useCreditosIA } from '../hooks/useCreditosIA';
import CreditosIABadge from './CreditosIABadge';

interface ReconocerProductoFotoProps {
  // Se llama cuando la IA identificó un producto. El padre decide qué hacer
  // con los datos (autocompletar un form, filtrar una lista, etc.) — este
  // componente no conoce la forma del formulario que lo usa. `categoria` es
  // la categoría EXISTENTE del tenant que coincide con la sugerida por la IA,
  // o null si no hay ninguna con ese nombre (no se crean categorías solas).
  onDetectado: (
    producto: ProductoDetectado,
    coincidencias: ProductoCoincidente[],
    categoria: CategoriaEncontrada | null,
  ) => void;
  onError?: (mensaje: string) => void;
  className?: string;
}

// Botón + lógica de reconocimiento de producto por foto, reutilizado en el
// form "Crear producto" de Nueva Compra y en "Nuevo Producto" (compra
// rápida). Sube la foto, llama a /voice/reconocer-producto-detallado (Claude
// + búsqueda web cuando hace falta) y entrega el resultado al padre.
const ReconocerProductoFoto = ({ onDetectado, onError, className }: ReconocerProductoFotoProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resumen, setResumen] = useState<string | null>(null);
  const [avisoCategoria, setAvisoCategoria] = useState<string | null>(null);
  const { alcanza } = useCreditosIA('producto');

  const handleArchivo = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setResumen(null);
    setAvisoCategoria(null);

    const base64 = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result ? result.split(',')[1] : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    if (!base64) {
      onError?.('No se pudo leer la imagen seleccionada.');
      return;
    }

    setProcesando(true);
    try {
      const respuesta = await reconocerProductoDetallado(base64);
      if (!respuesta.success || !respuesta.producto || !respuesta.producto.nombre_producto) {
        onError?.(respuesta.mensaje || 'No se pudo identificar el producto en la foto. Probá con otra más nítida y de frente.');
        return;
      }
      const categoria = await buscarCategoriaPorNombre(respuesta.producto.categoria_sugerida);
      const p = respuesta.producto;
      setResumen(
        [
          p.nombre_producto,
          p.contenido_neto,
          p.unidad_medida_sugerida === 'CAJA' && p.unidades_por_presentacion
            ? `caja x${p.unidades_por_presentacion}`
            : null,
        ].filter(Boolean).join(' · '),
      );
      setAvisoCategoria(
        !categoria && p.categoria_sugerida
          ? `La IA sugirió la categoría "${p.categoria_sugerida}", que no está en tu lista: elegí una o creala.`
          : null,
      );
      onDetectado(p, respuesta.productosCoincidentes || [], categoria);
    } catch (error) {
      onError?.(mensajeErrorIA(error, 'Error al analizar la foto del producto.'));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleArchivo(file);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-3">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Producto"
            className="h-12 w-12 shrink-0 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
          />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={procesando || !alcanza}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2.5 text-sm text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all disabled:opacity-60"
        >
          {procesando ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Analizando producto...
            </>
          ) : (
            <>
              <Camera size={16} />
              {previewUrl ? 'Probar con otra foto' : 'Completar con una foto'}
              <Sparkles size={12} className="opacity-70" />
            </>
          )}
        </button>
      </div>
      <CreditosIABadge tipo="producto" className="mt-1" />
      {resumen && !procesando && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={13} className="shrink-0" />
          <span className="truncate">Detectado: {resumen}. Revisá los datos antes de guardar.</span>
        </p>
      )}
      {avisoCategoria && !procesando && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{avisoCategoria}</p>
      )}
    </div>
  );
};

export default ReconocerProductoFoto;
