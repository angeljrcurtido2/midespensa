import { useState, useCallback } from 'react';
import api from '../lib/axiosConfig';
import type { ChatMessage, ChatMetricasResponse, UseChatMetricasResult } from '../types/chat';

/**
 * Hook para chat IA de métricas (ventas/compras/inventario)
 */
export const useChatMetricas = (): UseChatMetricasResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    history: ChatMessage[],
  ): Promise<ChatMetricasResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.post('/voice/chat-metricas', {
        text: message,
        history,
      });

      const data: ChatMetricasResponse = response.data;
      setIsProcessing(false);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al procesar el mensaje';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
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

