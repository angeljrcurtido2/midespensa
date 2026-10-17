import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChatMetricas } from '../../hooks/useChatMetricas';
import type { ChatMessage, MetricsSnapshot } from '../../types/chat';

import ProgresoIA from '../../components/ProgresoIA';
interface ChatMetricasModalProps {
  visible: boolean;
  onClose: () => void;
}

const ChatMetricasModal: React.FC<ChatMetricasModalProps> = ({ visible, onClose }) => {
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isProcessing, error, resetError } = useChatMetricas();

  const formatGs = useCallback((value: number) => {
    const formatter = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });
    return `Gs ${formatter.format(value || 0)}`;
  }, []);

  const formatUnits = useCallback((units: number) => {
    const formatter = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });
    return formatter.format(units || 0);
  }, []);

  const buildVentaQtyLabel = useCallback((s: MetricsSnapshot) => {
    const parts: string[] = [];
    if (s.ventas.cajas_vendidas > 0) parts.push(`${formatUnits(s.ventas.cajas_vendidas)} cajas`);
    if (s.ventas.unidades_sueltas > 0) parts.push(`${formatUnits(s.ventas.unidades_sueltas)} sueltas`);
    if (parts.length === 0) parts.push(`${formatUnits(s.ventas.unidades_vendidas)} unidades`);
    return parts.join(' · ');
  }, [formatUnits]);

  const buildCompraQtyLabel = useCallback((s: MetricsSnapshot) => {
    const parts: string[] = [];
    if (s.compras.cajas_compradas > 0) parts.push(`${formatUnits(s.compras.cajas_compradas)} cajas`);
    if (s.compras.unidades_sueltas > 0) parts.push(`${formatUnits(s.compras.unidades_sueltas)} sueltas`);
    if (parts.length === 0) parts.push(`${formatUnits(s.compras.unidades_compradas)} unidades`);
    return parts.join(' · ');
  }, [formatUnits]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setTextInput('');
      setChatHistory([]);
      setSnapshot(null);
      resetError();
    }
  }, [visible, resetError]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleClose = useCallback(() => {
    setTextInput('');
    setChatHistory([]);
    setSnapshot(null);
    resetError();
    onClose();
  }, [onClose, resetError]);

  const handleQuickCommand = useCallback((command: string) => {
    setTextInput(command);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!textInput.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textInput.trim(),
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setTextInput('');

    const response = await sendMessage(userMessage.content, chatHistory);
    if (response) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.mensaje,
        timestamp: new Date().toISOString(),
      };
      setChatHistory([...newHistory, assistantMessage]);
      setSnapshot(response.snapshot);
    } else {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'No pude procesar tu consulta. Probá reformularla.',
        timestamp: new Date().toISOString(),
      };
      setChatHistory([...newHistory, assistantMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4V7m2 14H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">Chat IA - Métricas</h2>
                <p className="text-white/80 text-sm">Ventas · Compras · Inventario</p>
              </div>
            </div>
            <button onClick={handleClose} className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-170px)]">
          {/* Snapshot resumen (más visual) */}
          {snapshot && (
            <div className="mb-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-slate-700">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Período</div>
                  <div className="text-sm font-semibold">
                    {snapshot.periodo.from} <span className="text-slate-400">→</span> {snapshot.periodo.to}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                  Snapshot actualizado
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas</div>
                  <div className="mt-1 text-2xl font-extrabold text-indigo-700">{formatGs(snapshot.ventas.total)}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {snapshot.ventas.cantidad} operación(es) · {buildVentaQtyLabel(snapshot)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Compras</div>
                  <div className="mt-1 text-2xl font-extrabold text-rose-700">{formatGs(snapshot.compras.total)}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {snapshot.compras.cantidad} operación(es) · {buildCompraQtyLabel(snapshot)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventario</div>
                  <div className="mt-1 text-2xl font-extrabold text-emerald-700">{formatGs(snapshot.inventario.valor_inventario)}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {snapshot.inventario.total_productos} productos · {snapshot.inventario.productos_sin_stock} sin stock
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-sm font-extrabold text-slate-800">Comparación rápida</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-indigo-50 p-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total ventas</div>
                      <div className="mt-1 text-lg font-extrabold text-indigo-800">{formatGs(snapshot.ventas.total)}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Total compras</div>
                      <div className="mt-1 text-lg font-extrabold text-rose-800">{formatGs(snapshot.compras.total)}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    {(() => {
                      const ventas = snapshot.ventas.total || 0;
                      const compras = snapshot.compras.total || 0;
                      const total = ventas + compras || 1;
                      const ventasPct = Math.round((ventas / total) * 100);
                      const comprasPct = 100 - ventasPct;
                      return (
                        <div className="flex h-full w-full">
                          <div className="h-full bg-indigo-500" style={{ width: `${ventasPct}%` }} />
                          <div className="h-full bg-rose-500" style={{ width: `${comprasPct}%` }} />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Barra proporcional (ventas vs compras) según montos del período.
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-sm font-extrabold text-slate-800">Top productos (cantidad)</div>
                  {snapshot.topProductos.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-600">Sin datos para el período.</div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {snapshot.topProductos.slice(0, 5).map((p) => (
                        <div key={p.idproducto} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800">{p.nombre_producto}</div>
                            <div className="text-xs text-slate-500">{formatGs(p.total_ingresos)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-extrabold text-slate-900">{p.total_vendido}</div>
                            <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden border border-slate-200 hidden sm:block">
                              <div
                                className="h-full bg-indigo-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round((p.total_vendido / Math.max(1, snapshot.topProductos[0].total_vendido)) * 100),
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick commands */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => handleQuickCommand('Dame un resumen de ventas y compras de esta semana.')} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
              Resumen semana
            </button>
            <button onClick={() => handleQuickCommand('¿Cuáles son los productos más vendidos?')} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
              Top vendidos
            </button>
            <button onClick={() => handleQuickCommand('¿Qué debería reponer primero según el stock?')} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
              Reposición
            </button>
            <button onClick={() => handleQuickCommand('¿Hay lotes por vencer en los próximos 30 días?')} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
              Por vencer
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="space-y-3"
          >
            {chatHistory.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">
                Escribí una consulta para obtener métricas y recomendaciones.
              </div>
            )}

            {chatHistory.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'} max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isProcessing && <ProgresoIA className="max-w-md" />}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer input */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ej.: ¿Cómo estuvo la venta esta semana y qué acciones recomendás?"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !textInput.trim()}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-white font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              {isProcessing ? 'Procesando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMetricasModal;
