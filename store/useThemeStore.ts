import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  headerColor: string;
  backgroundColor: string;
  textColor: string;

  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setTextColor: (color: string) => void;

  resetTheme: () => void; 
}

export const useThemeStore = create(
  persist<ThemeStore>(
    (set) => ({
      headerColor: 'blue',      
      backgroundColor: 'white', 
      textColor: 'black',      

      setHeaderColor: (color) => set({ headerColor: color }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setTextColor: (color) => set({ textColor: color }),

      resetTheme: () =>
        set({
          headerColor: 'blue',
          backgroundColor: 'white',
          textColor: 'black',
        }),
    }),
    {
      name: 'theme-storage', 
    }
  )
);
