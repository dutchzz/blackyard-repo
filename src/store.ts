import { create } from 'zustand';

interface OrderItem {
  id: string;
  title: string;
  price: number;
}

interface AppState {
  theme: string;
  setTheme: (theme: string) => void;
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isOver18: boolean;
  setIsOver18: (val: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'zinc',
  setTheme: (theme) => set({ theme }),
  cart: [],
  addToCart: (item) => set((state) => {
    if (state.cart.find(i => i.id === item.id)) return state;
    return { cart: [...state.cart, item] };
  }),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(i => i.id !== id) })),
  clearCart: () => set({ cart: [] }),
  isOver18: false,
  setIsOver18: (isOver18) => set({ isOver18 }),
}));
