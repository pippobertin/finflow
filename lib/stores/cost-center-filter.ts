import { create } from "zustand";

interface CostCenterFilterState {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleId: (id: string) => void;
  clearFilter: () => void;
}

export const useCostCenterFilter = create<CostCenterFilterState>((set) => ({
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleId: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),
  clearFilter: () => set({ selectedIds: [] }),
}));
