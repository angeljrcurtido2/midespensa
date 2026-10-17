import React, { useState, useRef, useEffect } from 'react';
import { useTextToIncome } from '../../hooks/useTextToIncome';
import type { ParsedIncome } from '../../types/chat';

import ProgresoIA from '../../components/ProgresoIA';
interface ChatIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngresoRegistrado?: (ingreso: ParsedIncome) => void;
}

const ChatIngresoModal: React.FC<ChatIngresoModalProps> = ({
  isOpen,
  onClose,
  onIngresoRegistrado,
}) => {
  const { parseAndRegisterIncome, isProcessing, error } = useTextToIncome();
  const [parsedData, setParsedData] = useState<ParsedIncome | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setTextInput('');
      setParsedData(null);
      setChatError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!textInput.trim()) {
      setChatError('Por favor, escribe un comando');
      return;
    }

    try {
      setChatError(null);
      console.log('📝 Procesando y registrando:', textInput);

      const data = await parseAndRegisterIncome(textInput);

      if (data) {
        setParsedData(data);
        console.log('  Ingreso registrado en BD:', data);
        setTextInput('');

        onIngresoRegistrado?.(data);
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          setParsedData(null);
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('  Error:', err);
      setChatError('Error al procesar el comando');
    }
  };

  const handleQuickCommand = (command: string) => {
    setTextInput(command);
    inputRef.current?.focus();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-bold">Registrar Ingreso por Chat</h2>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Input de chat */}
          <div className="mb-4">
            <label className="text-gray-700 font-semibold mb-2 block">
              Escribe tu comando:
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
              <textarea
                ref={inputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ej: Registrar un ingreso de 150 dólares por venta de equipos"
                className="flex-1 text-gray-800 text-base bg-transparent outline-none resize-none min-h-[60px]"
                rows={3}
                disabled={isProcessing || !!parsedData}
              />
            </div>

            {isProcessing && <ProgresoIA className="mt-3" />}

            {/* Botón Enviar */}
            {!parsedData && (
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !textInput.trim()}
                className={`mt-3 w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 px-6 flex items-center justify-center gap-2 text-white font-semibold transition-all hover:shadow-lg ${
                  isProcessing || !textInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>{isProcessing ? 'Procesando...' : 'Enviar'}</span>
              </button>
            )}
          </div>

          {/* Error */}
          {(chatError || error) && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{chatError || error}</p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {showSuccess && parsedData && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-bold text-lg">¡Ingreso Registrado!</p>
              </div>
              <p className="text-green-600">Ingreso de ${parsedData.monto} registrado exitosamente</p>
            </div>
          )}

          {/* Datos parseados */}
          {parsedData && !showSuccess && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Datos Extraídos:</h3>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {/* Monto */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Monto:</span>
                  <span className="text-xl font-bold text-green-600">${parsedData.monto.toFixed(2)}</span>
                </div>

                {/* Concepto */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Concepto:</span>
                  <span className="text-gray-800 font-semibold">{parsedData.concepto}</span>
                </div>

                {/* Tipo */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Tipo:</span>
                  <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-700 font-semibold text-xs">
                    {parsedData.tipo_movimiento}
                  </span>
                </div>

                {/* Observaciones */}
                {parsedData.observaciones && (
                  <div className="py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium block mb-1">Observaciones:</span>
                    <span className="text-gray-700">{parsedData.observaciones}</span>
                  </div>
                )}

                {/* Confianza */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Confianza:</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-200 rounded-full h-2 w-24">
                      <div
                        className={`h-2 rounded-full ${getConfidenceBgColor(parsedData.confidence)}`}
                        style={{ width: `${parsedData.confidence}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getConfidenceColor(parsedData.confidence)}`}>
                      {parsedData.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comandos rápidos */}
          {!parsedData && !isProcessing && (
            <div className="mt-6 bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800 font-semibold">Ejemplos de comandos:</span>
              </div>

              <div className="space-y-2">
                {[
                  'Registrar 150 por venta de equipos',
                  'Ingreso de 50 por servicio técnico',
                  'Anotar 75 de reparación',
                  'Venta de productos por 200',
                ].map((command, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickCommand(command)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-left text-blue-700 text-sm hover:bg-blue-100 transition-colors"
                  >
                    💬 {command}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatIngresoModal;
