import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: string[];
  addFavorite: (idHash: string) => void;
  removeFavorite: (idHash: string) => void;
  toggleFavorite: (idHash: string) => void;
  isFavorite: (idHash: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (idHash: string) => {
        set((state) => ({
          favorites: state.favorites.includes(idHash)
            ? state.favorites
            : [...state.favorites, idHash],
        }));
      },
      removeFavorite: (idHash: string) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== idHash),
        }));
      },
      toggleFavorite: (idHash: string) => {
        const isFav = get().favorites.includes(idHash);
        if (isFav) {
          get().removeFavorite(idHash);
        } else {
          get().addFavorite(idHash);
        }
      },
      isFavorite: (idHash: string) => {
        return get().favorites.includes(idHash);
      },
    }),
    {
      name: 'in1bet-favorites',
    }
  )
);
