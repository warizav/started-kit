import { create } from 'zustand';

const useStoreFoods = create((set) => ({
  foods: 0,
  increasePopulation: () => set((state) => ({ foods: state.foods + 1 })),
  removeAllFoods: () => set({ foods: 0 }),
  updateFoods: (newFood) => set({ foods: newFood })
}));

export default useStoreFoods;
