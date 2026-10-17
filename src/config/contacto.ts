// Contacto del administrador del sistema (licencias, pagos, habilitación de cuentas).
export const WHATSAPP_NUMERO = '595983312082'; // 0983 312 082
export const WHATSAPP_TEXTO = '0983 312 082';
export const whatsappUrl = (mensaje?: string) =>
  `https://wa.me/${WHATSAPP_NUMERO}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;
