'use client';
import { FaSpinner, FaEnvelope, FaTrash, FaCog, FaInbox, FaBell, FaSave, FaVial, FaInfoCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import {
  getEmailConfig,
  saveEmailConfig,
  testEmailConfig,
  updateEmailStatus,
  deleteEmailConfig,
  type EmailConfig,
  type EmailConfigPayload
} from '../../services/emailConfig';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import ModalAdvert from '../../components/ModalAdvert';

const initialFormData: EmailConfigPayload = {
  smtp_service: 'gmail',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_password: '',
  notify_to: '',
  notify_cc: '',
  notify_bcc: '',
  email_enabled: true,
  notify_ventas_programadas: true,
  notify_ventas_credito: false,
  notify_stock_bajo: false,
};

const ConfiguracionEmail = () => {
  const [formData, setFormData] = useState<EmailConfigPayload>(initialFormData);
  const [hasConfig, setHasConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Modales
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      const response = await getEmailConfig();

      if (response.data.success && response.data.hasConfig) {
        const config: EmailConfig = response.data.config;
        setFormData({
          smtp_service: config.smtp_service,
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          smtp_secure: config.smtp_secure,
          smtp_user: config.smtp_user,
          smtp_password: '', // No mostrar la contraseña
          notify_to: config.notify_to,
          notify_cc: config.notify_cc || '',
          notify_bcc: config.notify_bcc || '',
          email_enabled: config.email_enabled,
          notify_ventas_programadas: config.notify_ventas_programadas,
          notify_ventas_credito: config.notify_ventas_credito,
          notify_stock_bajo: config.notify_stock_bajo,
        });
        setHasConfig(true);
      } else {
        setHasConfig(false);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasConfig(false);
      } else {
        console.error('Error al cargar configuración:', error);
        setErrorMessage('Error al cargar configuración de email');
        setErrorModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;

    // Configuración automática según el servicio
    if (service === 'gmail') {
      setFormData((prev) => ({
        ...prev,
        smtp_service: 'gmail',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: false,
      }));
    } else if (service === 'outlook') {
      setFormData((prev) => ({
        ...prev,
        smtp_service: 'outlook',
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        smtp_secure: false,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        smtp_service: 'custom',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.smtp_user || !formData.notify_to) {
      setErrorMessage('Los campos Usuario SMTP y Email de Notificación son obligatorios');
      setErrorModalOpen(true);
      return;
    }

    if (!hasConfig && !formData.smtp_password) {
      setErrorMessage('La contraseña SMTP es obligatoria al crear la configuración');
      setErrorModalOpen(true);
      return;
    }

    try {
      setSaving(true);

      // Si tiene config y no se cambió la contraseña, no enviarla
      const payload = { ...formData };
  
      await saveEmailConfig(payload);

      setSuccessMessage('  Configuración guardada exitosamente');
      setSuccessModalOpen(true);
      setHasConfig(true);

      // Recargar configuración
      await loadEmailConfig();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setErrorMessage(error.response?.data?.error || 'Error al guardar configuración');
      setErrorModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!hasConfig) {
      setErrorMessage('Primero debes guardar la configuración antes de probarla');
      setErrorModalOpen(true);
      return;
    }

    try {
      setTesting(true);
      const response = await testEmailConfig();

      setSuccessMessage(`  ${response.data.message}`);
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Error al probar email:', error);
      setErrorMessage(error.response?.data?.error || 'Error al enviar email de prueba');
      setErrorModalOpen(true);
    } finally {
      setTesting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = formData.email_enabled ? 'inactiva' : 'activa';
      await updateEmailStatus(newStatus);

      setFormData((prev) => ({
        ...prev,
        email_enabled: !prev.email_enabled,
      }));

      setSuccessMessage(`Notificaciones ${newStatus === 'activa' ? 'activadas' : 'desactivadas'} exitosamente`);
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      setErrorMessage('Error al cambiar estado de notificaciones');
      setErrorModalOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmailConfig();

      setFormData(initialFormData);
      setHasConfig(false);
      setDeleteModalOpen(false);

      setSuccessMessage('  Configuración eliminada exitosamente');
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      setErrorMessage('Error al eliminar configuración');
      setErrorModalOpen(true);
    }
  };


if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <FaEnvelope /> Configuración de Email
            </h2>

            {hasConfig && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 rounded-md text-white font-medium transition ${
                    formData.email_enabled
                      ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                      : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
                  }`}
                >
                  {formData.email_enabled ? 'Activado' : 'Desactivado'}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md font-medium transition flex items-center gap-2"
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Configuración SMTP */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaCog /> Configuración SMTP
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Servicio de Email
                  </label>
                  <select
                    name="smtp_service"
                    value={formData.smtp_service}
                    onChange={handleServiceChange}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usuario SMTP *
                  </label>
                  <input
                    type="email"
                    name="smtp_user"
                    value={formData.smtp_user}
                    onChange={handleChange}
                    placeholder="tu-email@gmail.com"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña SMTP {hasConfig && '(dejar vacío para no cambiar)'}
                  </label>
                  <input
                    type="password"
                    name="smtp_password"
                    value={formData.smtp_password}
                    onChange={handleChange}
                    placeholder={hasConfig ? '••••••••' : 'Contraseña de aplicación'}
                    required={!hasConfig}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {formData.smtp_service === 'gmail' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Usa una contraseña de aplicación desde tu cuenta de Google
                    </p>
                  )}
                </div>

                {formData.smtp_service === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Host SMTP
                      </label>
                      <input
                        type="text"
                        name="smtp_host"
                        value={formData.smtp_host}
                        onChange={handleChange}
                        placeholder="smtp.tuservidor.com"
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Puerto SMTP
                      </label>
                      <input
                        type="number"
                        name="smtp_port"
                        value={formData.smtp_port}
                        onChange={handleChange}
                        placeholder="587"
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="smtp_secure"
                        checked={formData.smtp_secure}
                        onChange={handleChange}
                        className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Usar SSL/TLS (puerto 465)
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Destinatarios */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaInbox /> Destinatarios
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Principal (Para) *
                  </label>
                  <input
                    type="email"
                    name="notify_to"
                    value={formData.notify_to}
                    onChange={handleChange}
                    placeholder="notificaciones@tuempresa.com"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email CC (Copia)
                  </label>
                  <input
                    type="email"
                    name="notify_cc"
                    value={formData.notify_cc}
                    onChange={handleChange}
                    placeholder="opcional@tuempresa.com"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email BCC (Copia Oculta)
                  </label>
                  <input
                    type="email"
                    name="notify_bcc"
                    value={formData.notify_bcc}
                    onChange={handleChange}
                    placeholder="opcional@tuempresa.com"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Tipos de Notificaciones */}
            <div className="pb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaBell /> Tipos de Notificaciones
              </h3>

              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    name="notify_ventas_programadas"
                    checked={formData.notify_ventas_programadas}
                    onChange={handleChange}
                    className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Ventas Programadas
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Notificar cuando se genere una venta programada automáticamente
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    name="notify_ventas_credito"
                    checked={formData.notify_ventas_credito}
                    onChange={handleChange}
                    className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Ventas a Crédito
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Notificar cuando se registre una venta a crédito
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    name="notify_stock_bajo"
                    checked={formData.notify_stock_bajo}
                    onChange={handleChange}
                    className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Stock Bajo
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Notificar cuando un producto llegue al stock mínimo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-blue-400 dark:disabled:bg-blue-500 text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <FaSave /> Guardar Configuración
                  </>
                )}
              </button>

              {hasConfig && (
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testing}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 disabled:bg-green-400 dark:disabled:bg-green-500 text-white font-semibold py-3 rounded-md transition flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <FaSpinner className="animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <FaVial /> Probar Email
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <FaInfoCircle /> Información importante:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Para Gmail, debes habilitar el acceso de aplicaciones menos seguras o generar una contraseña de aplicación</li>
            <li>Las contraseñas se almacenan encriptadas en la base de datos</li>
            <li>Puedes probar la configuración antes de activar las notificaciones</li>
            <li>Solo los usuarios administradores pueden configurar notificaciones por email</li>
          </ul>
        </div>
      </div>

      {/* Modales */}
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={successMessage}
      />

      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />

      <ModalAdvert
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        message="¿Estás seguro de que deseas eliminar la configuración de email? Esta acción no se puede deshacer."
        
      />
    </div>
  );
};

export default ConfiguracionEmail;