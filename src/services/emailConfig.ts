import api from '../lib/axiosConfig';

export interface EmailConfig {
  id?: number;
  idusuarios?: number;
  smtp_service: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password?: string;
  notify_to: string;
  notify_cc?: string;
  notify_bcc?: string;
  email_enabled: boolean;
  notify_ventas_programadas: boolean;
  notify_ventas_credito: boolean;
  notify_stock_bajo: boolean;
  estado: 'activa' | 'inactiva';
  created_at?: string;
  updated_at?: string;
}

export interface EmailConfigPayload {
  smtp_service: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  notify_to: string;
  notify_cc?: string;
  notify_bcc?: string;
  email_enabled: boolean;
  notify_ventas_programadas: boolean;
  notify_ventas_credito: boolean;
  notify_stock_bajo: boolean;
  estado?: string;
}

// Obtener configuración de email del usuario
export const getEmailConfig = () => {
  return api.get('/email-config');
};

// Crear o actualizar configuración de email
export const saveEmailConfig = (payload: EmailConfigPayload) => {
  return api.post('/email-config', payload);
};

// Probar configuración de email (enviar email de prueba)
export const testEmailConfig = () => {
  return api.post('/email-config/test');
};

// Actualizar estado (activar/desactivar)
export const updateEmailStatus = (estado: 'activa' | 'inactiva') => {
  return api.patch('/email-config/status', { estado });
};

// Actualizar flags de notificación
export const updateNotificationFlags = (flags: {
  email_enabled?: boolean;
  notify_ventas_programadas?: boolean;
  notify_ventas_credito?: boolean;
  notify_stock_bajo?: boolean;
}) => {
  return api.patch('/email-config/notifications', flags);
};

// Eliminar configuración de email
export const deleteEmailConfig = () => {
  return api.delete('/email-config');
};
