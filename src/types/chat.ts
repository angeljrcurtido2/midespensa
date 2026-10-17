/**
 * Tipos para el sistema de chat con IA
 */

export interface ParsedIncome {
  monto: number;
  concepto: string;
  tipo_movimiento: string;
  fecha?: string;
  observaciones?: string;
  confidence: number;
  idingreso?: number;
  idtipo_ingreso?: number;
  idmovimiento?: number;
  hora?: string;
  message?: string;
}

export interface ParsedExpense {
  monto: number;
  concepto: string;
  tipo_movimiento: string;
  fecha?: string;
  observaciones?: string;
  confidence: number;
  idegreso?: number;
  idtipo_egreso?: number;
  idmovimiento?: number;
  hora?: string;
  message?: string;
}

export interface UseTextToIncomeResult {
  parseTextToIncome: (text: string) => Promise<ParsedIncome | null>;
  parseAndRegisterIncome: (text: string) => Promise<ParsedIncome | null>;
  isProcessing: boolean;
  error: string | null;
  lastParsedData: ParsedIncome | null;
}

export interface UseTextToExpenseResult {
  parseTextToExpense: (text: string) => Promise<ParsedExpense | null>;
  parseAndRegisterExpense: (text: string) => Promise<ParsedExpense | null>;
  isProcessing: boolean;
  error: string | null;
  lastParsedData: ParsedExpense | null;
}

export interface ParsedProvider {
  accion: 'crear' | 'editar' | 'eliminar';
  nombre?: string;
  telefono?: string;
  ruc?: string;
  razon?: string;
  direccion?: string;
  email?: string;
  estado?: 'activo' | 'inactivo';
  idproveedor?: number;
  confidence: number;
  message?: string;
}

// Tipos para chat conversacional de proveedores
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatProviderResponse {
  mensaje: string; // El servidor devuelve "mensaje" no "response"
  esperandoRespuesta: boolean; // El servidor devuelve "esperandoRespuesta" no "requires_user_input"
  resultado?: ParsedProvider; // Cuando la acción se ejecuta exitosamente
  contexto?: ParsedProvider; // Datos parciales mientras se completa la info
  camposFaltantes?: string[]; // Campos que aún faltan
}

export interface UseTextToProviderResult {
  sendMessage: (message: string, history: ChatMessage[]) => Promise<ChatProviderResponse | null>;
  isProcessing: boolean;
  error: string | null;
  resetError: () => void;
}

// Tipos para chat conversacional de clientes
export interface ParsedCliente {
  accion: 'crear' | 'editar' | 'eliminar';
  nombre?: string;
  apellido?: string;
  numDocumento?: string;
  telefono?: string;
  direccion?: string;
  tipo?: 'persona' | 'empresa';
  genero?: 'masculino' | 'femenino' | 'otro';
  estado?: 'activo' | 'inactivo';
  tipo_cliente?: 'minorista' | 'mayorista';
  idcliente?: number;
  confidence: number;
  message?: string;
}

export interface ChatClienteResponse {
  mensaje: string;
  esperandoRespuesta: boolean;
  resultado?: ParsedCliente;
  contexto?: ParsedCliente;
  camposFaltantes?: string[];
}

export interface UseTextToClienteResult {
  sendMessage: (message: string, history: ChatMessage[]) => Promise<ChatClienteResponse | null>;
  isProcessing: boolean;
  error: string | null;
  resetError: () => void;
}

// Tipos para chat conversacional de facturadores
export interface ParsedFacturador {
  accion: 'crear' | 'editar' | 'eliminar';
  nombre_fantasia?: string;
  ruc?: string;
  razon_social?: string;
  timbrado?: string;
  fecha_inicio_vigencia?: string;
  fecha_fin_vigencia?: string;
  actividades_ids?: number[];
  actividades_confirmadas?: boolean;
  estado?: 'activo' | 'inactivo';
  idfacturador?: number;
  confidence: number;
  message?: string;
}

export interface ChatFacturadorResponse {
  mensaje: string;
  esperandoRespuesta: boolean;
  resultado?: ParsedFacturador;
  contexto?: ParsedFacturador;
  camposFaltantes?: string[];
}

export interface UseTextToFacturadorResult {
  sendMessage: (message: string, history: ChatMessage[]) => Promise<ChatFacturadorResponse | null>;
  isProcessing: boolean;
  error: string | null;
  resetError: () => void;
}

// ========== MÉTRICAS (IA) ==========
export interface MetricsSnapshot {
  periodo: { from: string; to: string };
  ventas: {
    cantidad: number;
    total: number;
    unidades_vendidas: number;
    cajas_vendidas: number;
    unidades_sueltas: number;
  };
  compras: {
    cantidad: number;
    total: number;
    unidades_compradas: number;
    cajas_compradas: number;
    unidades_sueltas: number;
  };
  topProductos: Array<{
    idproducto: number;
    nombre_producto: string;
    total_vendido: number;
    total_ingresos: number;
  }>;
  inventario: {
    valor_inventario: number;
    total_productos: number;
    productos_sin_stock: number;
    lotes_por_vencer_30d: Array<{
      idlote: number;
      idproducto: number;
      nombre_producto: string;
      numero_lote: string;
      fecha_vencimiento: string;
      stock_actual: number;
    }>;
  };
}

export interface ChatMetricasResponse {
  mensaje: string;
  snapshot: MetricsSnapshot;
}

export interface UseChatMetricasResult {
  sendMessage: (message: string, history: ChatMessage[]) => Promise<ChatMetricasResponse | null>;
  isProcessing: boolean;
  error: string | null;
  resetError: () => void;
}
