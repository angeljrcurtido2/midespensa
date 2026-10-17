import { create } from 'zustand';

/** Cantidad máxima de ventanas abiertas a la vez: pasado el tope se cierra la más antigua que no esté a la vista. */
export const MAX_PESTANAS = 12;

interface TabsStore {
  /** Rutas abiertas, en orden de apertura. */
  tabs: string[];
  abrir: (ruta: string, activa: string) => void;
  /** Quita la ventana y devuelve la ruta que debería quedar a la vista si era la activa. */
  cerrar: (ruta: string) => string | null;
  cerrarOtras: (ruta: string) => void;
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [],
  abrir: (ruta, activa) =>
    set((s) => {
      if (s.tabs.includes(ruta)) return s;
      let tabs = [...s.tabs, ruta];
      while (tabs.length > MAX_PESTANAS) {
        const idx = tabs.findIndex((t) => t !== activa && t !== ruta);
        if (idx < 0) break;
        tabs.splice(idx, 1);
      }
      return { tabs };
    }),
  cerrar: (ruta) => {
    const { tabs } = get();
    const i = tabs.indexOf(ruta);
    if (i < 0) return null;
    const resto = tabs.filter((t) => t !== ruta);
    set({ tabs: resto });
    return resto[i] ?? resto[i - 1] ?? null;
  },
  cerrarOtras: (ruta) => set((s) => ({ tabs: s.tabs.filter((t) => t === ruta || t === '/dashboard') })),
}));
