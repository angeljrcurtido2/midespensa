import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTextToFacturador } from '../../hooks/useTextToFacturador';
import type { ChatMessage, ParsedFacturador } from '../../types/chat';

import ProgresoIA from '../../components/ProgresoIA';
interface ChatFacturadorModalProps {
  visible: boolean;
  onClose: () => void;
  onFacturadorActuado?: (data: ParsedFacturador) => void;
}

const ChatFacturadorModal: React.FC<ChatFacturadorModalProps> = ({
  visible,
  onClose,
  onFacturadorActuado,
}) => {
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isProcessing, error, resetError } = useTextToFacturador();

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Resetear todo al cerrar
      setTextInput('');
      setChatHistory([]);
      setShowSuccess(false);
      resetError();
    }
  }, [visible, resetError]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async () => {
    if (!textInput.trim() || isProcessing) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: textInput.trim(),
      timestamp: new Date().toISOString(),
    };

    // Agregar mensaje del usuario al historial
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setTextInput('');

    console.log('💬 Enviando mensaje:', userMessage.content);

    // Enviar mensaje al backend
    const response = await sendMessage(userMessage.content, chatHistory);

    if (response) {
      // Agregar respuesta del asistente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.mensaje,
        timestamp: new Date().toISOString(),
      };

      setChatHistory([...newHistory, assistantMessage]);

      // Si la acción está lista y se ejecutó
      if (response.resultado && !response.esperandoRespuesta) {
        console.log('  Acción ejecutada:', response.resultado);
        onFacturadorActuado?.(response.resultado);
        setShowSuccess(true);

        setTimeout(() => {
          handleClose();
        }, 2500);
      }
    } else {
      // Si hay un error del servidor
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentar reformularlo?',
        timestamp: new Date().toISOString(),
      };
      setChatHistory([...newHistory, errorMessage]);
    }
  };

  const handleClose = useCallback(() => {
    setTextInput('');
    setChatHistory([]);
    setShowSuccess(false);
    resetError();
    onClose();
  }, [onClose, resetError]);

  const handleQuickCommand = useCallback((command: string) => {
    setTextInput(command);
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">Chat IA - Facturadores</h2>
                <p className="text-green-100 text-xs">Conversa naturalmente para gestionar facturadores</p>
              </div>
            </div>
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

        {/* Chat Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 dark:bg-gray-900 space-y-4"
        >
          {chatHistory.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-green-50 dark:bg-gray-700 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-green-600 dark:text-green-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">¡Hola!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Puedo ayudarte a crear, editar o eliminar facturadores. Solo dime qué necesitas hacer.
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ejemplos:</p>
                  {[
                    'Quiero crear un nuevo facturador',
                    'Necesito editar el timbrado de un facturador',
                    'Eliminar facturador con RUC 12345678',
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickCommand(example)}
                      className="block w-full text-left text-xs text-green-700 dark:text-green-300 bg-white dark:bg-gray-600 hover:bg-green-100 dark:hover:bg-gray-500 px-3 py-2 rounded-lg transition-colors border border-green-200 dark:border-gray-500"
                    >
                      💡 {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-md border border-gray-100 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="bg-green-100 rounded-full p-1">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    {message.timestamp && (
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-green-200' : 'text-gray-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('es-PY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <ProgresoIA className="w-full max-w-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-green-800">  Acción ejecutada exitosamente</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={resetError}
                className="text-red-600 hover:text-red-800 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !textInput.trim()}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
                isProcessing || !textInput.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatFacturadorModal;
