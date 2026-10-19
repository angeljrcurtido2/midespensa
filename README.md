# Mi Despensa (versión gratuita)

Proyecto separado de `migracion_cliente` (el sistema de pago), con su propia identidad visual.
Comparte el backend (`server-desa`): los límites del plan Free se aplican allá, no acá.

- Nombre e identidad: `src/config/marca.ts`, paleta en `src/globals.css`.
- Menú reducido: `src/utils/generateNavItems.ts`.
- Desarrollo: `npm install` y `npm run dev` (con `.env.local` apuntando al backend).
- Producción: definir `VITE_API_BASE_URL`. IA apagada por defecto.

## Publicación (midespensa.shop)

1. Repositorio en GitHub (uno propio, separado del sistema de pago) y sitio en Netlify conectado a él. `netlify.toml` ya trae el comando (`npm run build`), la carpeta (`dist`) y las variables públicas (API compartida y ID de cliente de Google).
2. Dominio: en Netlify, Domain management → agregar `midespensa.shop` (y `www`). En el registro del dominio apuntar los DNS a Netlify.
3. Google Cloud → Clientes → Mi Despensa web → Orígenes autorizados de JavaScript: `https://midespensa.shop` y `https://www.midespensa.shop` (más `http://localhost:5181` para desarrollo).
4. Servidor (`server-desa/server.js`): los dos orígenes ya están en la lista de CORS.
5. Las rutas usan HashRouter: no hacen falta reglas de redirección.
