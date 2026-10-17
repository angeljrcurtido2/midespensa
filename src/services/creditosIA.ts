import api from '../lib/axiosConfig';

// Créditos IA del mes: cada foto de producto usa 1, cada factura usa 2, cada mensaje a Tuki usa 1 y cada consulta de un producto a Tuki también usa 1.
// El dueño de la cuenta y sus funcionarios comparten el mismo saldo.
export const CREDITOS_POR_TIPO = { factura: 2, producto: 1, asistente: 1, chat: 1 } as const;
export type TipoCreditoIA = keyof typeof CREDITOS_POR_TIPO;

export interface SaldoCreditosIA {
  periodo: string;
  renueva: string; // YYYY-MM-DD
  incluidos: number;
  extra: number;
  total: number;
  usados: number;
  disponibles: number;
}

export interface CreditosIACliente extends SaldoCreditosIA {
  consultas: number;
  facturas: number;
  fotos_producto: number;
  costo_usd: number;
  extras: Array<{ id: number; creditos: number; nota: string | null; created_at: string }>;
}

// Estado compartido: varios componentes muestran el saldo a la vez (ej. la
// búsqueda por foto en Ventas y el formulario de producto) y todos tienen que
// ver el descuento apenas vuelve una respuesta de la IA.
let saldoActual: SaldoCreditosIA | null = null;
let cargando: Promise<void> | null = null;
const suscriptores = new Set<() => void>();

const notificar = () => suscriptores.forEach((fn) => fn());

export const suscribirCreditosIA = (fn: () => void) => {
  suscriptores.add(fn);
  return () => {
    suscriptores.delete(fn);
  };
};

export const leerCreditosIA = () => saldoActual;

export const actualizarCreditosIA = (saldo: SaldoCreditosIA | null | undefined) => {
  if (!saldo || typeof saldo.disponibles !== 'number') return;
  saldoActual = saldo;
  notificar();
};

export const cargarCreditosIA = (forzar = false): Promise<void> => {
  if (cargando && !forzar) return cargando;
  cargando = api
    .get<SaldoCreditosIA>('/voice/creditos-ia')
    .then((r) => actualizarCreditosIA(r.data))
    .catch(() => {
      // Sin saldo visible el botón sigue habilitado; el backend igual valida.
    })
    .finally(() => {
      cargando = null;
    });
  return cargando;
};

// Toma el saldo que viene en una respuesta de error (402 sin créditos, 502)
// y devuelve el mensaje del backend para mostrarlo tal cual.
export const mensajeErrorIA = (err: unknown, porDefecto: string): string => {
  const data = (err as { response?: { data?: { error?: string; creditos_ia?: SaldoCreditosIA } } })?.response?.data;
  actualizarCreditosIA(data?.creditos_ia);
  return data?.error || porDefecto;
};

export const formatearFechaRenovacion = (renueva: string) => {
  const [anio, mes, dia] = renueva.split('-');
  return `${dia}/${mes}/${anio}`;
};

// Panel del proveedor (licencias)
export const getCreditosIACliente = async (idusuarios: number) => {
  const r = await api.get<CreditosIACliente>(`/licencias/creditos-ia/${idusuarios}`);
  return r.data;
};

export const agregarCreditosIA = async (idusuarios: number, creditos: number, nota?: string) => {
  const r = await api.post<{ message: string; saldo: SaldoCreditosIA }>(`/licencias/creditos-ia/${idusuarios}`, {
    creditos,
    nota,
  });
  return r.data;
};
