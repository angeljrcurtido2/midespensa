# MiNegocio (versión gratuita)

Proyecto separado de `migracion_cliente` (el sistema de pago), con su propia identidad visual.
Comparte el backend (`server-desa`): los límites del plan Free se aplican allá, no acá.

- Nombre e identidad: `src/config/marca.ts`, paleta en `src/globals.css`.
- Menú reducido: `src/utils/generateNavItems.ts`.
- Desarrollo: `npm install` y `npm run dev` (con `.env.local` apuntando al backend).
- Producción: definir `VITE_API_BASE_URL`. IA apagada por defecto.
