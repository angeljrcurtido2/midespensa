import { useState } from 'react';
import api from '../lib/axiosConfig';
import type { ParsedIncome, UseTextToIncomeResult } from '../types/chat';

/**
 * Hook para convertir texto a ingresos usando IA
 */
export const useTextToIncome = (): UseTextToIncomeResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParsedData, setLastParsedData] = useState<ParsedIncome | null>(null);

  /**
   * Parsea el texto pero NO registra en la BD
   * (Útil para mostrar preview antes de confirmar)
   */
  const parseTextToIncome = async (text: string): Promise<ParsedIncome | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Llamada al backend que usa Ollama para procesar texto
      const response = await api.post('/voice/parse-income', { text });

      const data: ParsedIncome = response.data;
      setLastParsedData(data);
      setIsProcessing(false);

      return data;
    } catch (err: any) {
      console.error('Error parsing text to income:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  /**
   * Parsea Y REGISTRA directamente en la BD
   * (Automático, no requiere confirmación adicional)
   */
  const parseAndRegisterIncome = async (text: string): Promise<ParsedIncome | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('📝 Procesando y registrando:', text);

      // Llamada al nuevo endpoint que parsea Y registra
      const response = await api.post('/voice/register-income', { text });

      const data: ParsedIncome = response.data;
      setLastParsedData(data);
      setIsProcessing(false);

      console.log('  Ingreso registrado exitosamente:', data);

      return data;
    } catch (err: any) {
      console.error('Error al registrar ingreso:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  return {
    parseTextToIncome,
    parseAndRegisterIncome,
    isProcessing,
    error,
    lastParsedData,
  };
};
