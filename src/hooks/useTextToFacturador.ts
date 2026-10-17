import { useState, useCallback } from 'react';
import type { ChatMessage, ChatFacturadorResponse, UseTextToFacturadorResult } from '../types/chat';
import api from '../lib/axiosConfig';

export const useTextToFacturador = (): UseTextToFacturadorResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    history: ChatMessage[]
  ): Promise<ChatFacturadorResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('📤 Enviando mensaje al backend (Facturador):', {
        mensaje: message,
        historialLength: history.length,
      });

      const response = await api.post<ChatFacturadorResponse>('/voice/chat-facturador',
        {
          mensaje: message,
          historial: history,
        }
      );

      console.log('📥 Respuesta del backend (Facturador):', response.data);

      return response.data;
    } catch (err: any) {
      console.error('  Error al enviar mensaje (Facturador):', err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Error desconocido al procesar el mensaje';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isProcessing,
    error,
    resetError,
  };
};
