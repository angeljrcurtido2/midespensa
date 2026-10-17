import React, { useState, useRef, useEffect } from 'react';
import { useTextToExpense } from '../../hooks/useTextToExpense';
import type { ParsedExpense } from '../../types/chat';

import ProgresoIA from '../../components/ProgresoIA';
interface ChatEgresoModalProps {
  visible: boolean;
  onClose: () => void;
  onEgresoRegistrado?: (data: ParsedExpense) => void;
}

const ChatEgresoModal: React.FC<ChatEgresoModalProps> = ({
  visible,
  onClose,
  onEgresoRegistrado,
}) => {
  const [textInput, setTextInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedExpense | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { parseAndRegisterExpense, isProcessing, error } = useTextToExpense();

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setTextInput('');
      setParsedData(null);
      setShowSuccess(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!textInput.trim()) {
      return;
    }

    console.log('📝 Procesando texto:', textInput);

    const data = await parseAndRegisterExpense(textInput);

    if (data) {
      console.log('📊 Egreso registrado:', data);
      setParsedData(data);
      onEgresoRegistrado?.(data);
      setShowSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setTextInput('');
    setParsedData(null);
    setShowSuccess(false);
    onClose();
  };

  const handleQuickCommand = (command: string) => {
    setTextInput(command);
    inputRef.current?.focus();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Registrar Egreso por Chat
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          {/* Input de texto */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block text-gray-700">
              Describe el egreso:
            </label>
            <textarea
              ref={inputRef}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Ej: Registrar egreso de 50000 gs por compra de insumos"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={3}
              disabled={isProcessing}
            />
            {isProcessing && <ProgresoIA className="mt-3" />}
          </div>

          {/* Ejemplos */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-semibold mb-2 text-blue-900">Ejemplos:</p>
            <div className="space-y-1">
              {[
                'Egreso de 30000 por pago de servicios',
                'Compra de insumos por 50000 guaraníes',
                'Gastos varios 20000 gs',
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickCommand(example)}
                  className="block w-full text-left text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>

          {/* Datos parseados */}
          {parsedData && !showSuccess && (
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-semibold mb-3 text-green-900">📋 Datos extraídos:</p>
              <div className="space-y-2 text-sm text-gray-800">
                <p>💰 Monto: <span className="font-bold">{parsedData.monto}</span></p>
                <p>📝 Concepto: <span className="font-semibold">{parsedData.concepto}</span></p>
                {parsedData.observaciones && (
                  <p>📌 Observaciones: {parsedData.observaciones}</p>
                )}
                <p>🎯 Confianza: <span className="font-semibold text-blue-600">{parsedData.confidence}%</span></p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {showSuccess && (
            <div className="bg-green-100 border border-green-300 p-4 rounded-lg mb-4 animate-in fade-in slide-in-from-top-4">
              <p className="text-lg font-bold text-green-800 text-center mb-2">
                  Egreso registrado exitosamente
              </p>
              {parsedData && (
                <div className="text-center text-green-700">
                  <p>Monto: {parsedData.monto} Gs</p>
                  <p>Concepto: {parsedData.concepto}</p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-300 p-3 rounded-lg mb-4">
              <p className="text-sm text-red-800">  {error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !textInput.trim()}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                isProcessing || !textInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                '🚀 Registrar Egreso'
              )}
            </button>

            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="w-full bg-gray-500 hover:bg-gray-600 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatEgresoModal;
