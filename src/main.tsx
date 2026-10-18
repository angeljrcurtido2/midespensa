import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useTablasMovil } from './hooks/useTablasMovil';
import { HashRouter, useLocation, useRoutes } from 'react-router-dom';
import { ShellPersistente } from './components/SidebarLayout';
import Workspace from './components/Workspace';
import routes from '~react-pages';
import './globals.css';
import { useDarkModeStore } from '../store/useDarkModeStore'
import ErrorPantalla, { recargarPorVersionNueva } from './components/ErrorPantalla';
import { iniciarResaltadoDeCampos } from './utils/camposInvalidos';

iniciarResaltadoDeCampos();

// Vite avisa con este evento cuando no se puede cargar el archivo de una pantalla (típico tras publicar una
// versión nueva con el sistema abierto): se recarga la página una vez para tomar la versión nueva.
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); recargarPorVersionNueva(); });

// Función helper para sincronizar la clase dark
const syncDarkMode = (isDark: boolean) => {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

function AppWrapper() {
  const darkMode = useDarkModeStore((s) => s.darkMode);

  // Sincronizar clase 'dark' con <html> cuando cambie darkMode
  useEffect(() => {
    syncDarkMode(darkMode);
  }, [darkMode]);

  // Suscribirse a cambios del store (captura hidratación desde localStorage)
  useEffect(() => {
    // Sincronizar estado inicial
    syncDarkMode(useDarkModeStore.getState().darkMode);

    // Suscribirse a cambios futuros
    const unsub = useDarkModeStore.subscribe((state) => {
      syncDarkMode(state.darkMode);
    });

    return () => unsub();
  }, []);

  return <App />;
}

// Pantallas sin menú lateral: el resto comparte un único sidebar que no se vuelve a montar al navegar.
const RUTAS_SIN_MENU = ['/login'];

function App() {
  useTablasMovil();
  const { pathname } = useLocation();
  if (RUTAS_SIN_MENU.includes(pathname.replace(/\/+$/, ''))) return <PantallaSinMenu />;
  // Con menú: espacio de trabajo con ventanas (pestañas con X) dentro del shell persistente.
  return <ErrorPantalla><ShellPersistente><Workspace /></ShellPersistente></ErrorPantalla>;
}

function PantallaSinMenu() {
  return useRoutes(routes);
}

// HashRouter (no BrowserRouter): el cliente empaquetado corre desde file://
// (Electron carga dist/index.html directo desde disco), donde el History API que
// usa BrowserRouter no puede resolver rutas — quedaba en blanco con "No routes
// matched location" apenas se abría el .exe instalado (bug real reportado). En
// dev (Vite sirviendo por http://localhost:5173) HashRouter funciona igual.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  </React.StrictMode>,
);
