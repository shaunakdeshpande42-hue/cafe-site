"use client";

import { create } from "zustand";
import type { InventoryEntry } from "@/app/api/inventory/route";

interface InventoryStore {
  entries: Record<string, InventoryEntry>; // keyed by item_id
  lastFetched: number | null;
  setEntries: (items: InventoryEntry[]) => void;
  /** null = unlimited / not configured (no restriction). ≥0 = hard cap remaining. */
  getRemaining: (itemId: string) => number | null;
  isSoldOut: (itemId: string) => boolean;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  entries: {},
  lastFetched: null,

  setEntries: (items) => {
    const map: Record<string, InventoryEntry> = {};
    for (const entry of items) map[entry.item_id] = entry;
    set({ entries: map, lastFetched: Date.now() });
  },

  getRemaining: (itemId) => {
    const e = get().entries[itemId];
    if (!e || !e.is_set || e.is_unlimited) return null;
    return e.remaining ?? 0;
  },

  isSoldOut: (itemId) => {
    const remaining = get().getRemaining(itemId);
    return remaining !== null && remaining <= 0;
  },
}));
