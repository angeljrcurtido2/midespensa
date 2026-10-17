import api from '../lib/axiosConfig';

export interface CajaEnVivo {
  idmovimiento: number;
  num_caja: number;
  estado: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  idfuncionario: number | null;
  responsable: string;
  monto_apertura: number;
  ingresos: number;
  egresos: number;
  contado: number;
  cobrado: number;
  credito: number;
  cant_movimientos: number;
  saldo: number;
  ultimo_movimiento: string | null;
}

export interface MovimientoEnVivo {
  tipo: 'ingreso' | 'egreso' | 'venta_credito';
  id: number;
  idmovimiento: number;
  concepto: string;
  monto: number;
  created_at: string;
  responsable: string;
  num_caja: number;
}

export interface SnapshotCajas {
  cajas: CajaEnVivo[];
  movimientos: MovimientoEnVivo[];
  generado: string;
}

export interface EventoActividad {
  modulo: string;
  accion: string;
  por: { tipo: 'funcionario' | 'administrador'; nombre: string; idfuncionario?: number };
  ts: string;
}

export const getCajasEnVivo = async (): Promise<SnapshotCajas> => {
  const { data } = await api.get('/movimientos/en-vivo');
  return data;
};

/** ws(s)://host/ws a partir de la URL base de la API (…/api). */
export const urlWebSocket = () => {
  const base = String(api.defaults.baseURL || '');
  return base.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws';
};
