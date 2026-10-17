import { Sparkles } from 'lucide-react';
import { useCreditosIA } from '../hooks/useCreditosIA';
import { formatearFechaRenovacion, type TipoCreditoIA } from '../services/creditosIA';

interface CreditosIABadgeProps {
  tipo: TipoCreditoIA;
  className?: string;
}

// Línea chica con el saldo de créditos IA del mes, para mostrar junto a los
// botones que usan la IA. Cambia de color cuando queda poco o no alcanza.
const CreditosIABadge = ({ tipo, className = '' }: CreditosIABadgeProps) => {
  const { saldo, costo, alcanza } = useCreditosIA(tipo);
  if (!saldo) return null;

  const renueva = formatearFechaRenovacion(saldo.renueva);
  const poco = saldo.total > 0 && saldo.disponibles / saldo.total <= 0.1;
  const color = !alcanza
    ? 'text-red-600 dark:text-red-400'
    : poco
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-gray-500 dark:text-gray-400';

  return (
    <p
      className={`flex items-center gap-1 text-[11px] leading-tight ${color} ${className}`}
      title={`Cada ${tipo === 'factura' ? 'factura' : tipo === 'chat' || tipo === 'asistente' ? 'mensaje a Tuki' : 'foto'} usa ${costo} crédito${costo > 1 ? 's' : ''}. Se renuevan el ${renueva}.`}
    >
      <Sparkles size={11} className="shrink-0" />
      {alcanza ? (
        <span>
          {saldo.disponibles} de {saldo.total} créditos IA este mes · {tipo === 'factura' ? 'esta factura' : tipo === 'chat' || tipo === 'asistente' ? 'cada mensaje a Tuki' : 'esta foto'} usa {costo}
        </span>
      ) : (
        <span>Sin créditos IA este mes. Se renuevan el {renueva}; si necesitás más, pedí un paquete adicional.</span>
      )}
    </p>
  );
};

export default CreditosIABadge;
