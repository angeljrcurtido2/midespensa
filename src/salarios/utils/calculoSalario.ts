import type { ModalidadSalario, Salario } from '../../services/rrhh';

/**
 * Derivaciones del salario para mostrar en pantalla.
 *
 * Replican la fórmula de `server-desa/services/rrhh/calculoRemuneracion.js`,
 * que es la única fuente de verdad: acá sólo se usan para previsualizar y
 * explicar, nunca para decidir cuánto se paga. Si las dos divergen, manda el
 * backend.
 */

const JORNADA_DEFECTO = 8;
const DIAS_MES_DEFECTO = 30;

type SalarioParcial = Pick<Salario, 'salario_base'> &
  Partial<Pick<Salario, 'modalidad' | 'jornada_horas' | 'dias_mes'>>;

const num = (v: unknown, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : def;
};

export const calcularValorHora = (salario: SalarioParcial | null | undefined): number => {
  if (!salario) return 0;
  const base = Number(salario.salario_base) || 0;
  const jornada = num(salario.jornada_horas, JORNADA_DEFECTO);
  const diasMes = num(salario.dias_mes, DIAS_MES_DEFECTO);
  const modalidad: ModalidadSalario = salario.modalidad || 'Mensual';

  switch (modalidad) {
    case 'Hora':
      return base;
    case 'Jornal':
      return base / jornada;
    case 'Quincenal':
      return base / 15 / jornada;
    default:
      return base / diasMes / jornada;
  }
};

export const calcularValorDia = (salario: SalarioParcial | null | undefined): number => {
  if (!salario) return 0;
  const base = Number(salario.salario_base) || 0;
  const jornada = num(salario.jornada_horas, JORNADA_DEFECTO);
  const diasMes = num(salario.dias_mes, DIAS_MES_DEFECTO);
  const modalidad: ModalidadSalario = salario.modalidad || 'Mensual';

  switch (modalidad) {
    case 'Hora':
      return base * jornada;
    case 'Jornal':
      return base;
    case 'Quincenal':
      return base / 15;
    default:
      return base / diasMes;
  }
};

/** Lo que costaría un mes completo, para poder comparar modalidades entre sí. */
export const calcularEquivalenteMensual = (
  salario: SalarioParcial | null | undefined,
): number => {
  if (!salario) return 0;
  const base = Number(salario.salario_base) || 0;
  const jornada = num(salario.jornada_horas, JORNADA_DEFECTO);
  const diasMes = num(salario.dias_mes, DIAS_MES_DEFECTO);
  const modalidad: ModalidadSalario = salario.modalidad || 'Mensual';

  switch (modalidad) {
    case 'Hora':
      return base * jornada * diasMes;
    case 'Jornal':
      return base * diasMes;
    case 'Quincenal':
      return base * 2;
    default:
      return base;
  }
};

export const formatGs = (v: number | string | null | undefined): string => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? `${Math.round(n).toLocaleString('es-PY')} Gs` : '--';
};
