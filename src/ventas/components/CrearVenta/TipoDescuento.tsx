export type TipoAjusteVenta = 'sin_descuento' | 'descuento_producto' | 'descuento_total' | 'recargo_producto' | 'recargo_total';

interface TipoDescuentoProps {
  value: TipoAjusteVenta;
  onSelectionChange: (tipo: TipoAjusteVenta) => void;
  className?: string;
  setMontoDescuentoTotal: (value: string) => void;
  setMontoRecargoTotal: (value: string) => void;
}

export const TipoDescuentoSelect: React.FC<TipoDescuentoProps> = ({ value, onSelectionChange, className = '', setMontoDescuentoTotal, setMontoRecargoTotal }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipo = e.target.value as TipoAjusteVenta;
    onSelectionChange(tipo);
    setMontoDescuentoTotal('');
    setMontoRecargoTotal('');
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 p-2 m-2">Tipo de ajuste</label>
      <select value={value} onChange={handleChange} className="w-auto px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <option value="sin_descuento">Sin descuento ni recargo</option>
        <option value="descuento_producto">Descuento por Producto</option>
        <option value="descuento_total">Descuento por Venta Total</option>
        <option value="recargo_producto">Recargo por Producto</option>
        <option value="recargo_total">Recargo por Venta Total</option>
      </select>
    </div>
  );
};

export default TipoDescuentoSelect;
