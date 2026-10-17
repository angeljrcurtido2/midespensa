'use client';

import { useState } from 'react';
import { FaLock, FaWhatsapp, FaTimes } from 'react-icons/fa';
import PagarLicencia from '../mi-licencia/components/PagarLicencia';
import { whatsappUrl, WHATSAPP_TEXTO } from '../config/contacto';

interface PantallaBloqueoProps {
  fechaVencimiento?: string | null;
  plan?: string | null;
  monto?: number | null;
  mensaje?: string;
  /** 'sin_licencia': cuenta nueva a la que todavía no se le cargó la licencia. */
  estado?: string;
  /** Un funcionario no paga la licencia: se le pide avisar al titular de la cuenta. */
  esFuncionario?: boolean;
  onCerrarSesion?: () => void;
}

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatearMonto = (monto?: number | null) => {
  if (monto === null || monto === undefined) return null;
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Number(monto));
};

/**
 * Pantalla que reemplaza al sistema cuando la licencia venció.
 *
 * Deliberadamente NO ofrece forma de seguir operando: el objetivo es que el
 * cliente regularice. Sí muestra los datos que necesita para hacerlo (monto,
 * fecha, contacto) y permite cerrar sesión.
 */
export default function PantallaBloqueo({
  fechaVencimiento,
  plan,
  monto,
  mensaje,
  estado,
  esFuncionario,
  onCerrarSesion,
}: PantallaBloqueoProps) {
  const montoFmt = formatearMonto(monto);
  const sinLicencia = estado === 'sin_licencia';
  const [verPago, setVerPago] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg mb-4">
              <FaLock className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              {sinLicencia ? 'Licencia pendiente de habilitación' : 'Sistema bloqueado'}
            </h1>
            <p className="text-gray-500 dark:text-gray-300 mt-2">
              {sinLicencia
                ? 'Tu cuenta fue creada correctamente, pero todavía no tiene una licencia habilitada. Favor contactar con el administrador para habilitar tu licencia.'
                : mensaje || 'Tu licencia venció. Regularizá el pago para volver a operar.'}
            </p>
          </div>

          {sinLicencia ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                Apenas el administrador habilite tu licencia podés empezar a usar el sistema; no hace falta crear la cuenta de nuevo.
              </p>
              <a
                href={whatsappUrl(sinLicencia ? "Hola, me registré en el sistema y necesito que habiliten mi licencia." : "Hola, necesito regularizar el pago de mi licencia.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:underline"
              >
                <FaWhatsapp size={18} />
                Contactar al administrador ({WHATSAPP_TEXTO})
              </a>
            </div>
          ) : (
          <>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-300">Venció el</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {formatearFecha(fechaVencimiento)}
              </span>
            </div>
            {plan && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-300">Plan</span>
                <span className="font-semibold text-gray-800 dark:text-white">{plan}</span>
              </div>
            )}
            {montoFmt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-300">Monto mensual</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  Gs. {montoFmt}
                </span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
              Tus datos están intactos. Apenas se registre el pago, el sistema se
              reactiva de inmediato.
            </p>
            {esFuncionario ? (
              <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                La licencia de la empresa venció. Avisale al titular de tu cuenta: él puede pagarla desde “Mi licencia”. Tu caja y tus datos siguen como estaban.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setVerPago(true)}
                className="mb-3 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700"
              >
                Pagar por transferencia o QR
              </button>
            )}
            <a
              href={whatsappUrl("Hola, necesito regularizar el pago de mi licencia.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:underline"
            >
              <FaWhatsapp size={18} />
              Contactar para regularizar ({WHATSAPP_TEXTO})
            </a>
          </div>

          </>
          )}

          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 py-3 rounded-xl font-semibold transition-all"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>

      {verPago && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="relative my-8 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setVerPago(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
              aria-label="Cerrar"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="mb-4 pr-8 text-2xl font-bold text-gray-800 dark:text-white">Pagar mi licencia</h2>
            <PagarLicencia montoSugerido={monto} />
          </div>
        </div>
      )}
    </div>
  );
}
