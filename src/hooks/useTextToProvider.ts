import { useState, useCallback } from 'react';
import api from '../lib/axiosConfig';
import type { ChatMessage, ChatProviderResponse, UseTextToProviderResult } from '../types/chat';

/**
 * Hook para chat conversacional con IA sobre proveedores
 * Mantiene contexto y permite conversaciones naturales
 */
export const useTextToProvider = (): UseTextToProviderResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Envía un mensaje al chat conversacional
   * Mantiene el historial de conversación para contexto
   */
  const sendMessage = useCallback(async (
    message: string,
    history: ChatMessage[]
  ): Promise<ChatProviderResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('💬 Enviando mensaje al chat:', message);
      console.log('📜 Historial:', history);

      // Llamada al endpoint de chat conversacional
      const response = await api.post('/voice/chat-provider', {
        text: message,
        history,
      });

      const data: ChatProviderResponse = response.data;
      setIsProcessing(false);

      console.log('  Respuesta del chat:', data);

      return data;
    } catch (err: any) {
      console.error('  Error en chat de proveedores:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error al procesar el mensaje';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  }, []);

  /**
   * Resetea el estado de error
   */
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
