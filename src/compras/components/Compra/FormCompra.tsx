'use client';
import type { FC } from "react";
import { useEffect, useState } from 'react';
import { getFormasPago } from "../../../services/formasPago";
import ModalSeleccionarDatosBancarios from "../../../datosbancarios/components/ModalsDatosBancarios/ModalSeleccionarDatosBancarios";
import ModalFormCheque from "../../../ventas/components/Cheques/ModalFormCheque";
import ModalFormTarjeta from "../../../ventas/components/Tarjetas/ModalFormTarjeta";
import { FaFileInvoice, FaCreditCard, FaStickyNote, FaTruck } from 'react-icons/fa';

interface Props {
  compra: any;
  setCompra: (data: any) => void;
  proveedorSeleccionado: any;
  openProveedorModal: () => void;
  /** Pantalla completa: las tarjetas van una debajo de otra. */
  pagina?: boolean;
}

const FormCompra: FC<Props> = ({ compra, setCompra, proveedorSeleccionado, openProveedorModal, pagina = false }) => {
  const [formasPago, setFormasPago] = useState<any[]>([]);
  const [modalSeleccionarOpen, setModalSeleccionarOpen] = useState(false);

  const [modalChequeOpen, setModalChequeOpen] = useState(false);
  const [datosCheque, setDatosCheque] = useState<any>({});

  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState<any>({});

  useEffect(() => {
    const fetchFormasPago = async () => {
      try {
        const res = await getFormasPago();
        setFormasPago(res.data);
      } catch (err) {
        console.error("  Error al obtener formas de pago", err);
      }
    };
    fetchFormasPago();
  }, []);

  useEffect(() => {
    if (compra.tipo === 'credito') {
      setCompra((prev: any) => ({ ...prev, idformapago: null }));
    }
  }, [compra.tipo]);

  return (
    <div className={pagina ? "space-y-2 p-3 text-sm dark:bg-gray-950 [&_h3]:text-xs [&_label]:text-xs [&_input]:px-3 [&_input]:py-1.5 [&_select]:px-3 [&_select]:py-1.5 [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-sm" : "space-y-3 p-4 dark:bg-gray-950"}>
      {/* Sin flex-wrap: con las columnas ya flexibles las dos tarjetas entran en
          una sola fila incluso a 1280px, y apilarlas sumaba ~90px de alto que
          empujaban los botones de acción fuera de la pantalla. */}
      <div className={pagina ? "flex flex-col gap-2" : "flex flex-row gap-3"}>
        {/* Sección 1: Información del Proveedor */}
        <div className={`${pagina ? "min-w-0" : "flex-1 basis-[200px] min-w-0"} bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-gray-800 shadow-sm overflow-hidden`}>

          <div className={pagina ? "flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 dark:from-gray-700 dark:to-gray-800" : "flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 dark:from-gray-700 dark:to-gray-800"}>
            <FaTruck className="text-white shrink-0" size={16} />
            {/* Sin truncate: recortaba el título a "INFORMA…" en pantallas chicas.
                leading-tight deja que baje de línea sin engordar la cabecera. */}
            <h3 className="text-sm font-bold text-white uppercase leading-tight">Información del Proveedor</h3>
          </div>
          <div className={pagina ? "p-2" : "p-4"}>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-bold">Proveedor</label>
              <button
                type="button"
                data-campo="proveedor"
                onClick={openProveedorModal}
                className="w-full border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-left bg-gray-50 dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                {proveedorSeleccionado?.nombre || 'Seleccionar'}
              </button>
            </div>
          </div>
        </div>

        {/* Sección 2: Información de la Compra */}
        <div className={`${pagina ? "min-w-0" : "flex-[1.3] basis-[320px] min-w-0"} bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-gray-800 shadow-sm overflow-hidden`}>
          <div className={pagina ? "flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 dark:from-gray-700 dark:to-gray-800" : "flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 dark:from-gray-700 dark:to-gray-800"}>
            <FaFileInvoice className="text-white" size={16} />
            <h3 className="text-sm font-bold text-white uppercase">Información de la Compra</h3>
          </div>
          <div className={pagina ? "p-3" : "p-4"}>
            <div className="flex flex-col gap-3">

              <div className="flex flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-bold">Nro. Factura</label>
                  <input
                    type="text"
                    required
                    data-campo="nro_factura"
                    value={compra.nro_factura}
                    onChange={e => setCompra((prev: any) => ({ ...prev, nro_factura: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-bold">Fecha</label>
                  {/* px-2: con px-4 el control de fecha no tenía ancho para el año
                      completo y mostraba "13/09" con el icono encima. */}
                  <input
                    type="date"
                    required
                    data-campo="fecha"
                    value={compra.fecha}
                    onChange={e => setCompra((prev: any) => ({ ...prev, fecha: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 px-2 py-2 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-bold">Tipo de Compra</label>
                <select
                  value={compra.tipo}
                  onChange={e => setCompra((prev: any) => ({ ...prev, tipo: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sección 3: Forma de Pago */}
      <div className={pagina ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : "flex flex-row gap-3"}>
        <div className={`${pagina ? "min-w-0" : "flex-1 basis-[240px] min-w-0"} bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-gray-800 shadow-sm overflow-hidden`}>
          <div className={pagina ? "flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-1 dark:from-gray-700 dark:to-gray-800" : "flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 dark:from-gray-700 dark:to-gray-800"}>
            <FaCreditCard className="text-white" size={pagina ? 13 : 16} />
            <h3 className={pagina ? "text-[11px] font-bold text-white uppercase" : "text-sm font-bold text-white uppercase"}>Forma de Pago</h3>
          </div>
          <div className={pagina ? "p-2" : "p-4"}>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className={pagina ? "mb-1 block text-[11px] font-semibold text-gray-600 dark:text-gray-300" : "block text-sm text-gray-600 dark:text-gray-300 mb-1 font-bold"}>Forma de Pago</label>
                <select
                  value={compra.idformapago || ''}
                  onChange={e =>
                    setCompra((prev: any) => ({
                      ...prev,
                      idformapago: Number(e.target.value),
                    }))
                  }
                  className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 ${pagina ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
                  disabled={compra.tipo === 'credito'}
                  required={compra.tipo === 'contado'}
                >
                  <option value="">Seleccione (solo contado)</option>
                  {formasPago.map((forma) => (
                    <option key={forma.idformapago} value={forma.idformapago}>
                      {forma.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {compra.idformapago === 2 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setModalSeleccionarOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    Seleccionar Datos Bancarios
                  </button>
                </div>
              )}

              {compra.idformapago === 3 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setModalChequeOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    Ingresar Datos del Cheque
                  </button>
                </div>
              )}

              {compra.idformapago === 4 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setModalTarjetaOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    Ingresar Datos Tarjeta C/D
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 4: Observaciones */}
        <div className={`${pagina ? "min-w-0" : "flex-1 basis-[240px] min-w-0"} bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 shadow-sm overflow-hidden`}>
          <div className={pagina ? "flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-1 dark:from-gray-700 dark:to-gray-800" : "flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 dark:from-gray-700 dark:to-gray-800"}>
            <FaStickyNote className="text-white" size={pagina ? 13 : 16} />
            <h3 className={pagina ? "text-[11px] font-bold text-white uppercase" : "text-sm font-bold text-white uppercase"}>Observaciones</h3>
          </div>
          <div className={pagina ? "p-2" : "p-4"}>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1 font-bold">Observación</label>
              <input
                type="text"
                placeholder="Observación (opcional)"
                value={compra.observacion}
                onChange={e => setCompra((prev: any) => ({ ...prev, observacion: e.target.value }))}
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 ${pagina ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
              />
            </div>
          </div>
        </div>
      </div>

      <ModalSeleccionarDatosBancarios
        isOpen={modalSeleccionarOpen}
        onClose={() => setModalSeleccionarOpen(false)}
        onSelect={(dato: any) => {
          setCompra((prev: any) => ({
            ...prev,
            detalle_transferencia_compra: dato
          }));
          setModalSeleccionarOpen(false);
        }}
      />

      <ModalFormCheque
        isOpen={modalChequeOpen}
        onClose={() => {
          setCompra((prev: any) => ({ ...prev, detalle_cheque: datosCheque }));
          setModalChequeOpen(false);
        }}
        datosCheque={datosCheque}
        setDatosCheque={setDatosCheque}
      />

      <ModalFormTarjeta
        isOpen={modalTarjetaOpen}
        onClose={() => {
          setCompra((prev: any) => ({ ...prev, detalle_tarjeta: datosTarjeta }));
          setModalTarjetaOpen(false);
        }}
        datosTarjeta={datosTarjeta}
        setDatosTarjeta={setDatosTarjeta}
      />
    </div>
  );
};

export default FormCompra;
