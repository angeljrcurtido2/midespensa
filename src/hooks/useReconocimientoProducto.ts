import { useState, useCallback, useRef } from 'react';
import { reconocerProductoDetallado } from '../services/reconocimiento';
import type { ProductoDetalladoResponse } from '../services/reconocimiento';
import { mensajeErrorIA } from '../services/creditosIA';

export interface UseReconocimientoProductoReturn {
  imagenCapturada: string | null;
  isProcessing: boolean;
  resultado: ProductoDetalladoResponse | null;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  iniciarCamara: () => Promise<void>;
  detenerCamara: () => void;
  capturarFoto: () => string | null;
  procesarImagen: (imageData: string) => Promise<ProductoDetalladoResponse | null>;
  seleccionarImagenArchivo: (file: File) => Promise<string | null>;
  reiniciar: () => void;
  tieneCamara: boolean;
}

export const useReconocimientoProducto = (): UseReconocimientoProductoReturn => {
  const [imagenCapturada, setImagenCapturada] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ProductoDetalladoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tieneCamara, setTieneCamara] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const iniciarCamara = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setTieneCamara(true);
      setError(null);
    } catch (err) {
      console.error('Error al iniciar cámara:', err);
      setError('No se pudo acceder a la cámara');
      setTieneCamara(false);
    }
  }, []);

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setTieneCamara(false);
  }, []);

  const capturarFoto = useCallback((): string | null => {
    if (!videoRef.current || !videoRef.current.videoWidth) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    setImagenCapturada(imageData);
    return imageData;
  }, []);

  const seleccionarImagenArchivo = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const base64 = result.split(',')[1];
          setImagenCapturada(base64);
          resolve(base64);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  const procesarImagen = useCallback(async (imageData: string): Promise<ProductoDetalladoResponse | null> => {
    setIsProcessing(true);
    setError(null);
    setResultado(null);

    try {
      const response = await reconocerProductoDetallado(imageData);
      setResultado(response);
      return response;
    } catch (err: unknown) {
      // El backend explica el motivo (ej. sin créditos IA este mes); el
      // mensaje genérico de axios ("status code 402") no le sirve al usuario.
      setError(mensajeErrorIA(err, 'No se pudo analizar la foto. Probá de nuevo.'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reiniciar = useCallback(() => {
    setImagenCapturada(null);
    setResultado(null);
    setError(null);
    detenerCamara();
  }, [detenerCamara]);

  return {
    imagenCapturada,
    isProcessing,
    resultado,
    error,
    videoRef,
    iniciarCamara,
    detenerCamara,
    capturarFoto,
    procesarImagen,
    seleccionarImagenArchivo,
    reiniciar,
    tieneCamara,
  };
};
