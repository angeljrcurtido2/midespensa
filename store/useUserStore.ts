import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  clearUserRole: () => void;
  resetStore: () => void; 
}

export const useUserStore = create(
  persist<UserStore>(
    (set) => ({
      userRole: null,
      setUserRole: (role) => set({ userRole: role }),
      clearUserRole: () => set({ userRole: null }),
      resetStore: () => {
        set({ userRole: null });
        localStorage.removeItem('user-storage'); 
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
