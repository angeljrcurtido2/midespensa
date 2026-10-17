'use client';

import { type FC, useEffect, useState } from 'react';
import { getFormasPago } from '../../../services/formasPago';
import ModalSeleccionarDatosBancarios from '../../../datosbancarios/components/ModalsDatosBancarios/ModalSeleccionarDatosBancarios';
import ModalFormCheque from '../Cheques/ModalFormCheque';
import ModalFormTarjeta from '../Tarjetas/ModalFormTarjeta';
import SeccionInfoGeneral from './FormVentaSections/SeccionInfoGeneral';
import SeccionDescuentos from './FormVentaSections/SeccionDescuentos';
import SeccionFormaPago from './FormVentaSections/SeccionFormaPago';
import SeccionPlanCuotas from './FormVentaSections/SeccionPlanCuotas';
import SeccionObservaciones from './FormVentaSections/SeccionObservaciones';
import type { TipoAjusteVenta } from './TipoDescuento';

interface Props {
  venta: any;
  setVenta: (data: any) => void;
  clienteSeleccionado: any;
  setTipoDescuento: (tipo: TipoAjusteVenta) => void;
  tipoDescuento: TipoAjusteVenta;
  setMontoDescuentoTotal: (value: string) => void;
  montoDescuentoTotal: string;
  setMontoRecargoTotal: (value: string) => void;
  montoRecargoTotal: string;
  openClienteModal: () => void;
  openSimuladorCuotas?: () => void;
  totalVenta?: number;
  /** Pantalla completa: las secciones van apiladas en una sola columna. */
  pagina?: boolean;
}

const FormVenta: FC<Props> = ({ pagina = false, setMontoDescuentoTotal, montoDescuentoTotal, setMontoRecargoTotal, montoRecargoTotal, venta, setVenta, clienteSeleccionado, openClienteModal, setTipoDescuento, tipoDescuento = "sin_descuento", openSimuladorCuotas, totalVenta = 0 }) => {
  const [formasPago, setFormasPago] = useState<any[]>([]);
  const [modalSeleccionarOpen, setModalSeleccionarOpen] = useState(false);

  const [modalChequeOpen, setModalChequeOpen] = useState(false);
  const [datosCheque, setDatosCheque] = useState({});

  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState({});

  useEffect(() => {
    const fetchFormasPago = async () => {
      try {
        const formasPago = await getFormasPago();
        setFormasPago(formasPago.data);
      } catch (error) {
        console.error('  Error al cargar formas de pago', error);
      }
    }
    fetchFormasPago();
  }, []);

  useEffect(() => {
    if (venta.tipo === 'credito') {
      setVenta((prev: any) => ({ ...prev, idformapago: null }));
    }
  }, [venta.tipo]);

  return (
    <div className={pagina ? "venta-compacta flex min-w-0 flex-col gap-2 pr-0" : "flex flex-col gap-6 pl-3 pr-3"}>
      {/* Fila 1: Información General + Descuentos */}
      <div className={pagina ? "flex flex-col gap-3" : "flex flex-row gap-3"}>
        <SeccionInfoGeneral
          venta={venta}
          setVenta={setVenta}
          clienteSeleccionado={clienteSeleccionado}
          openClienteModal={openClienteModal}
        />
        <div className={pagina ? 'w-full' : 'w-full max-w-[270px]'}>
          <SeccionDescuentos
            tipoDescuento={tipoDescuento}
            setTipoDescuento={setTipoDescuento}
            montoDescuentoTotal={montoDescuentoTotal}
            setMontoDescuentoTotal={setMontoDescuentoTotal}
            montoRecargoTotal={montoRecargoTotal}
            setMontoRecargoTotal={setMontoRecargoTotal}
          />
        </div>
      </div>
      <div className={pagina ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'flex flex-row gap-3'}>
        {/* Fila 2: Forma de Pago (Contado) o Plan de Cuotas (Crédito) */}
        <SeccionFormaPago
          venta={venta}
          setVenta={setVenta}
          formasPago={formasPago}
          setModalSeleccionarOpen={setModalSeleccionarOpen}
          setModalChequeOpen={setModalChequeOpen}
          setModalTarjetaOpen={setModalTarjetaOpen}
        />
        {venta.tipo === 'credito' && (
           <div className={pagina ? 'min-w-0' : 'w-full max-w-[410px]'}>
          <SeccionPlanCuotas
            venta={venta}
            setVenta={setVenta}
            totalVenta={totalVenta}
            openSimuladorCuotas={openSimuladorCuotas}
          />
        </div>
        )}
       
        {/* Fila 3: Observaciones */}
        <SeccionObservaciones venta={venta} setVenta={setVenta} />
      </div>


      <ModalSeleccionarDatosBancarios
        isOpen={modalSeleccionarOpen}
        onClose={() => setModalSeleccionarOpen(false)}
        onSelect={(dato: any) => {
          console.log('Dato bancario seleccionado:', dato);
          setVenta((prev: any) => ({
            ...prev,
            datos_bancarios: dato, // podés ajustar el nombre de esta propiedad
          }));
          setModalSeleccionarOpen(false);
        }}
      />

      <ModalFormCheque
        isOpen={modalChequeOpen}
        onClose={() => {
          setVenta((prev: any) => ({ ...prev, detalle_cheque: datosCheque }));
          setModalChequeOpen(false);
        }}
        datosCheque={datosCheque}
        setDatosCheque={setDatosCheque}
      />

      <ModalFormTarjeta
        isOpen={modalTarjetaOpen}
        onClose={() => {
          setVenta((prev: any) => ({ ...prev, detalle_tarjeta: datosTarjeta }));
          setModalTarjetaOpen(false);
        }}
        datosTarjeta={datosTarjeta}
        setDatosTarjeta={setDatosTarjeta}
      />

    </div>

  );
};

export default FormVenta;
