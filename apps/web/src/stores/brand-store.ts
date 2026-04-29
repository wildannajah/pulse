import { create } from "zustand";
import { persist } from "zustand/middleware";

type BrandStore = {
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
};

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      activeBrandId: null,
      setActiveBrandId: (activeBrandId) => set({ activeBrandId }),
    }),
    { name: "pulse-brand" },
  ),
);
