'use client';

import { useEffect, useState, useRef } from 'react';
import { FaMoneyBillWave, FaTimesCircle } from 'react-icons/fa';
import CrearArqueoCaja from '../Arqueo/CrearArqueoCaja';
import { cerrarCaja, registrarArqueo, getResumenMovimiento } from '../../../services/movimiento';
import { getArqueoFindByMovement } from '../../../services/arqueo';
import ModalError from '../../../components/ModalError';
import ModalSuccess from '../../../components/ModalSuccess';
import ModalAdvert from '../../../components/ModalAdvert';
import CardText from '../../../ventas/components/CobroDeudaVenta/components/CardText';

interface ResumenCaja {
  ingresos: number;
  egresos: number;
  contado: number;
  cobrado: number;
  compras: number;
  gastos: number;
  credito: number;
  monto_cierre: number;
  monto_apertura: number;
  /** Cobrado menos pagado por transferencia, tarjeta o cheque: no está en el cajón. */
  otros_medios?: number;
  cuadre_en_efectivo?: boolean;
  estado: string;
}

export interface ArqueoCaja {
    idarqueo: number,
    a50: number,
    a100: number,
    a500: number,
    a1000: number,
    a2000: number,
    a5000: number,
    a10000: number,
    a20000: number,
    a50000: number,
    a100000: number,
    total: string,
    detalle1: string,
    monto1: string,
    detalle2: string,
    monto2: string,
    detalle3: string,
    monto3: string,
    detalle4: string,
    monto4: string,
    detalle5: string,
    monto5: string,
    idmovimiento: number
}

const resumenInicial: ResumenCaja = {
  ingresos: 0,
  egresos: 0,
  contado: 0,
  cobrado: 0,
  compras: 0,
  gastos: 0,
  credito: 0,
  monto_cierre: 0,
  monto_apertura: 0,
  estado: '',
};

const arqueoInicial: ArqueoCaja = {
    idarqueo: 0,
    a50: 0,
    a100: 0,
    a500: 0,
    a1000: 0,
    a2000: 0,
    a5000: 0,
    a10000: 0,
    a20000: 0,
    a50000: 0,
    a100000: 0,
    total: "",
    detalle1: "",
    monto1: "",
    detalle2: "",
    monto2: "",
    detalle3: "",
    monto3: "",
    detalle4: "",
    monto4: "",
    detalle5: "",
    monto5: "",
    idmovimiento: 0
} 

interface CajaResumenProps {
  idmovimiento: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

const CajaResumen = ({ idmovimiento, onSuccess, onClose }: CajaResumenProps) => {
  type ArqueoRef = {
    getArqueoData: () => {
      total: number;
      payload: Record<string, any>;
    };
  };

  const arqueoRef = useRef<ArqueoRef>(null);
  const [resumen, setResumen] = useState<ResumenCaja>(resumenInicial);
  const [arqueo, setArqueo] = useState<ArqueoCaja>(arqueoInicial)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [advertOpen, setAdvertOpen] = useState(false);
  const [advertDiferenciaOpen, setAdvertDiferenciaOpen] = useState(false);
  const [mensajeDiferencia, setMensajeDiferencia] = useState('');
  const [pendingPayload, setPendingPayload] = useState<Record<string, any> | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  const fetchResumen = async () => {
    try {
      const res = await getResumenMovimiento(idmovimiento);
      const isStatusClose = res.data.estado === "cerrado"
      const resArqueo = isStatusClose && await getArqueoFindByMovement(idmovimiento);

      resArqueo && setArqueo(resArqueo.data) 
      setResumen(res.data);

    } catch (err: any) {
      console.error(err);
      setError('  Error al obtener resumen de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, [idmovimiento]);

  const ejecutarCierreCaja = async (payload: Record<string, any>) => {
    try {
      await registrarArqueo(payload);
      const res = await cerrarCaja(idmovimiento);
      setModalMessage(res.data.message || '  Caja cerrada correctamente');
      setSuccessOpen(true);
      fetchResumen();
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setModalMessage('  No se pudo completar el cierre de caja');
      setErrorOpen(true);
    } finally {
      setAdvertOpen(false);
      setAdvertDiferenciaOpen(false);
    }
  };

  const handleCerrarCaja = async () => {
    const arqueoData = arqueoRef.current?.getArqueoData();
    if (!arqueoData) return;

    const { total, payload } = arqueoData;

    // El guaraní no tiene centavos y el arqueo se carga en billetes enteros, pero el efectivo esperado puede traer decimales
    // (por ejemplo, cuotas con interés): se compara contra el esperado redondeado al guaraní.
    const esperado = Math.round(resumen.monto_cierre);
    const diferencia = Math.abs(total - esperado);
    if (resumen && diferencia >= 1) {
      const tipo = total > resumen.monto_cierre ? 'EXCESO' : 'FALTANTE';
      setMensajeDiferencia(
        `El arqueo no coincide con el total en caja. ` +
        `Efectivo esperado en caja: ₲ ${resumen.monto_cierre.toLocaleString('es-PY')} | ` +
        `Total Arqueado: ₲ ${total.toLocaleString('es-PY')} | ` +
        `Diferencia (${tipo}): ₲ ${diferencia.toLocaleString('es-PY')}. ` +
        `¿Deseas continuar con el cierre de todas formas?`
      );
      setPendingPayload(payload);
      setAdvertOpen(false);
      setAdvertDiferenciaOpen(true);
      return;
    }

    await ejecutarCierreCaja(payload);
  };

  const handleConfirmarDiferencia = async () => {
    if (pendingPayload) {
      await ejecutarCierreCaja(pendingPayload);
      setPendingPayload(null);
    }
  };

  if (loading) return <p className="text-gray-600">Cargando resumen...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!resumen) return null;



 return (
    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 mx-auto mt-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-row gap-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Resumen del Cierre de Caja</h2>
            {resumen.estado && (
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full shadow ${resumen.estado === 'cerrado'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}
              >
                {resumen.estado.toUpperCase()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CardText
              title="Ingresos"
              text={`₲ ${resumen.ingresos.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Monto Apertura"
              text={`₲ ${resumen.monto_apertura.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Egresos"
              text={`₲ ${resumen.egresos.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Compras"
              text={`₲ ${resumen.compras.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Gastos/Ajustes"
              text={`₲ ${resumen.gastos.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Ventas Contado"
              text={`₲ ${resumen.contado.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Cobros Deuda"
              text={`₲ ${resumen.cobrado.toLocaleString('es-PY')}`}
            />
            <CardText
              title="Ventas Crédito"
              text={`₲ ${resumen.credito.toLocaleString('es-PY')}`}
            />
          </div>

          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-800/40 p-3 rounded-lg">
                <FaMoneyBillWave className="text-green-600 dark:text-green-400 text-2xl" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {resumen.cuadre_en_efectivo === false ? 'Total en Caja' : 'Efectivo en Caja'}
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">₲ {resumen.monto_cierre.toLocaleString('es-PY')}</p>
                {resumen.cuadre_en_efectivo !== false && (
                  <p className="text-xs text-green-700/80 dark:text-green-300/80">Apertura + efectivo que entró − efectivo que salió. Es lo que tenés que contar en el arqueo.</p>
                )}
              </div>
            </div>
          </div>
          {!!resumen.otros_medios && resumen.cuadre_en_efectivo !== false && (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              Por transferencia, tarjeta o cheque: ₲ {resumen.otros_medios.toLocaleString('es-PY')} (no está en el cajón, no se cuenta en el arqueo).
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 mt-6">
            {resumen.estado === 'abierto' && (
              <button
                onClick={() => setAdvertOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                <FaTimesCircle />
                Cerrar Caja
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-md w-full sm:w-auto transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        <div>
          <CrearArqueoCaja ref={arqueoRef} idmovimiento={idmovimiento} estadoMovimiento={resumen.estado === "cerrado"} arqueoCerrado={arqueo}  />
        </div>
      </div>
      {/* Modales */}
      <ModalAdvert
        isOpen={advertOpen}
        onClose={() => setAdvertOpen(false)}
        onConfirm={handleCerrarCaja}
        message="¿Estás seguro de que deseas cerrar la caja?"
        confirmButtonText="Sí, cerrar"
      />

      <ModalAdvert
        isOpen={advertDiferenciaOpen}
        onClose={() => { setAdvertDiferenciaOpen(false); setPendingPayload(null); }}
        onConfirm={handleConfirmarDiferencia}
        message={mensajeDiferencia}
        confirmButtonText="Continuar de todas formas"
      />

      <ModalSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        message={modalMessage}
      />

      <ModalError
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default CajaResumen;