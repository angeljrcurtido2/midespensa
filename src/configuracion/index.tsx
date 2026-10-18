'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { getCargoUsuario } from '../services/usuarios';
import { getConfiguracionValor, updateConfiguration, getConfiguracionValorString, descargarBackup } from '../services/configuracion';
import SidebarLayout from '../components/SidebarLayout';
import ModalSuccess from '../components/ModalSuccess';
import ModalError from '../components/ModalError';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function Configuracion() {
  // El respaldo es de toda la base: solo lo ve el proveedor del sistema.
  const [esProveedor, setEsProveedor] = useState(false);
  useEffect(() => { getCargoUsuario().then((r) => setEsProveedor(!!r.data?.esProveedor)).catch(() => setEsProveedor(false)); }, []);
  const [valorLoteActual, setValorLoteActual] = useState<boolean | null>(null);
  const [nuevoValorLote, setNuevoValorLote] = useState<boolean>(false);

  const [, setHeaderColor] = useState("");
  const [, setNuevoValorHeaderColor] = useState("");

  const [, setBackgroundColor] = useState("");
  const [, setNuevoBackgroundColor] = useState("");

  const [, setTextColor] = useState("");
  const [, setNuevoTextColor] = useState("");

  const [, setTipoMoneda] = useState("");
  const [, setNuevoTipoMoneda] = useState("");

  const [valorVencimientoActual, setValorVencimientoActual] = useState<boolean | null>(null);
  const [nuevoValorVencimiento, setNuevoValorVencimiento] = useState<boolean>(false);

  const [valorVentasProgramadasActual, setValorVentasProgramadasActual] = useState<boolean | null>(null);
  const [nuevoValorVentasProgramadas, setNuevoValorVentasProgramadas] = useState<boolean>(false);

  const [, setValorTiendaActivaActual] = useState<boolean | null>(null);
  const [nuevoValorTiendaActiva, setNuevoValorTiendaActiva] = useState<boolean>(false);

  const [nombreTiendaActual, setNombreTiendaActual] = useState<string>('');
  const [nuevoNombreTienda, setNuevoNombreTienda] = useState<string>('');

  const [templateActual, setTemplateActual] = useState<string | null>(null);
  const [nuevoTemplate, setNuevoTemplate] = useState<string>('t1');

  // Estados para modales
  const [modalSuccessOpen, setModalSuccessOpen] = useState(false);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    getConfiguracionValor('sistema_venta_por_lote')
      .then((res: any) => {
        setValorLoteActual(res.data.valor);
        setNuevoValorLote(res.data.valor);

      })
      .catch(() => {
        setValorLoteActual(false);
        setNuevoValorLote(false);
      });

    getConfiguracionValor('headercolor_gral')
      .then((res: any) => {
        setHeaderColor(res.data.valor || '');
        setNuevoValorHeaderColor(res.data.valor || '');

      })
      .catch(() => {
        setHeaderColor("");
        setNuevoValorHeaderColor("");
      });

    getConfiguracionValor('backgroundcolor_gral')
      .then((res: any) => { setBackgroundColor(res.data.valor || ''); setNuevoBackgroundColor(res.data.valor || ''); })
      .catch(() => { setBackgroundColor(''); setNuevoBackgroundColor(''); });

    getConfiguracionValor('textcolor_gral')
      .then((res: any) => { setTextColor(res.data.valor || ''); setNuevoTextColor(res.data.valor || ''); })
      .catch(() => { setTextColor(''); setNuevoTextColor(''); });

    getConfiguracionValorString('tipoMoneda')
      .then((res: any) => { setTipoMoneda(res.data.valor || ''); setNuevoTipoMoneda(res.data.valor || ''); })
      .catch(() => { setTipoMoneda(''); setNuevoTipoMoneda(''); });

    getConfiguracionValor('venta_fecha_vencimiento')
      .then((res: any) => {
        setValorVencimientoActual(res.data.valor);
        setNuevoValorVencimiento(res.data.valor);
      })
      .catch(() => {
        setValorVencimientoActual(false);
        setNuevoValorVencimiento(false);
      });

    getConfiguracionValor('ventas_programadas')
      .then((res: any) => {
        setValorVentasProgramadasActual(res.data.valor);
        setNuevoValorVentasProgramadas(res.data.valor);
      })
      .catch(() => {
        setValorVentasProgramadasActual(false);
        setNuevoValorVentasProgramadas(false);
      });

    getConfiguracionValorString('nombre_tienda')
      .then((res: any) => {
        setNombreTiendaActual(res.data.valor || '');
        setNuevoNombreTienda(res.data.valor || '');
      })
      .catch(() => {
        setNombreTiendaActual('');
        setNuevoNombreTienda('');
      });

    getConfiguracionValor('tienda_activa')
      .then((res: any) => {
        setValorTiendaActivaActual(res.data.valor);
        setNuevoValorTiendaActiva(res.data.valor);
      })
      .catch(() => {
        setValorTiendaActivaActual(false);
        setNuevoValorTiendaActiva(false);
      });

    getConfiguracionValorString('selectedTemplate')
      .then((res: any) => {
        setTemplateActual(res.data.valor);
        setNuevoTemplate(res.data.valor);
      })
      .catch(() => {
        setTemplateActual('t1');
        setNuevoTemplate('t1');
      });

  }, []);

  const handleBackup = async () => {
    try {
      const blob = await descargarBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'respaldo.sql';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al bajar backup:', err);
    }
  };

  const handleGuardar = async () => {
    try {
      await updateConfiguration('sistema_venta_por_lote', nuevoValorLote);
      await updateConfiguration('venta_fecha_vencimiento', nuevoValorVencimiento);
      await updateConfiguration('ventas_programadas', nuevoValorVentasProgramadas);
      await updateConfiguration('tienda_activa', nuevoValorTiendaActiva);
      await updateConfiguration('nombre_tienda', nuevoNombreTienda);
      await updateConfiguration('selectedTemplate', nuevoTemplate);

      setTemplateActual(nuevoTemplate);
      setValorLoteActual(nuevoValorLote);
      setValorVencimientoActual(nuevoValorVencimiento);
      setValorVentasProgramadasActual(nuevoValorVentasProgramadas);
      setValorTiendaActivaActual(nuevoValorTiendaActiva);
      setNombreTiendaActual(nuevoNombreTienda);

      setModalMessage('  Configuraciones guardadas correctamente');
      setModalSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setModalMessage('  Error al guardar configuraciones');
      setModalErrorOpen(true);
    }
  };
const ConfigCard = ({
    title,
    description,
    value,
    onChange,
    current,
  }: {
    title: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    current: boolean | null;
  }) => (
    <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
        {current !== null ? (
          current ? (
            <span className="flex items-center text-green-600 dark:text-green-400 text-xs font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <CheckCircle size={14} className="mr-1" /> Activado
            </span>
          ) : (
            <span className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              <AlertCircle size={14} className="mr-1" /> Desactivado
            </span>
          )
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-xs">Cargando...</span>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={title}
        onClick={() => onChange(!value)}
        className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/30"
      >
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? 'bg-orange-600' : 'bg-stone-300'}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{value ? 'Sí' : 'No'}</span>
      </button>
    </div>
  );

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border-l-4 border-blue-500 dark:border-blue-600">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-gray-700 p-3 rounded-lg">
                <Settings className="text-blue-600 dark:text-blue-400" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración del Sistema</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ajustá cómo funciona tu despensa</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ConfigCard
              title="Elegir el lote al vender"
              description="Si lo activás, al vender elegís de qué lote sale cada producto. Si no, el sistema usa primero el que vence antes."
              value={nuevoValorLote}
              onChange={setNuevoValorLote}
              current={valorLoteActual}
            />
            <ConfigCard
              title="No vender productos vencidos"
              description="Impide vender un producto cuya fecha de vencimiento ya pasó."
              value={nuevoValorVencimiento}
              onChange={setNuevoValorVencimiento}
              current={valorVencimientoActual}
            />

            <ConfigCard
              title="Ventas programadas"
              description="Para ventas que se repiten solas (por ejemplo, un pedido semanal a un cliente)."
              value={nuevoValorVentasProgramadas}
              onChange={setNuevoValorVentasProgramadas}
              current={valorVentasProgramadasActual}
            />


            <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Nombre de tu despensa</h3>
                {nombreTiendaActual ? (
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">Configurado</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Sin configurar</span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Es el nombre que sale impreso en tus tickets y comprobantes.</p>
              <input
                type="text"
                value={nuevoNombreTienda}
                onChange={(e) => setNuevoNombreTienda(e.target.value)}
                placeholder="Ej: Despensa Don José"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Diseño del ticket y comprobante</h3>
                {templateActual ? (
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">{templateActual.toUpperCase()}</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">Cargando...</span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Elegí cómo querés que se vea lo que imprimís al vender.</p>
              <select
                value={nuevoTemplate}
                onChange={(e) => setNuevoTemplate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition"
              >
                <option value="t1">Plantilla Estándar</option>
                <option value="t2">Plantilla Formal A4</option>
                <option value="t3">Plantilla Compacta</option>
                <option value="t4">Plantilla Moderna</option>
              </select>
            </div>

          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            {esProveedor && (<button
              onClick={handleBackup}
              className="flex-1 group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-gray-700 dark:to-gray-800 px-6 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <ArrowDownTrayIcon className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:translate-y-1" />
              Descargar Respaldo
            </button>)}

            <button
              onClick={handleGuardar}
              className="flex-1 inline-flex items-center justify-center bg-blue-600 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <CheckCircle className="mr-2" size={20} />
              Guardar Configuraciones
            </button>
          </div>

          {/* Modales */}
          <ModalSuccess
            isOpen={modalSuccessOpen}
            onClose={() => setModalSuccessOpen(false)}
            message={modalMessage}
          />

          <ModalError
            isOpen={modalErrorOpen}
            onClose={() => setModalErrorOpen(false)}
            message={modalMessage}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}