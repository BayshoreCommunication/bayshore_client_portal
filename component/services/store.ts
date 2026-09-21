"use client";

import { useCallback } from "react";
import { useLocalStore } from "@/lib/local-store";
import type { ServiceCategoryKey } from "./data";

export type ServiceItem = {
  id: string;
  category: ServiceCategoryKey;
  name: string;
  price: number;
  custom?: boolean;
  description?: string;
  timeline?: string;
};

type ServicesState = {
  pending: ServiceItem[];
  purchased: ServiceItem[];
};

const INITIAL_STATE: ServicesState = { pending: [], purchased: [] };

export const useServices = () => {
  const [state, setState] = useLocalStore("bayshore_services", INITIAL_STATE);

  const addPending = useCallback(
    (item: ServiceItem) =>
      setState((previous) => ({ ...previous, pending: [...previous.pending, item] })),
    [setState]
  );

  const removePending = useCallback(
    (id: string) =>
      setState((previous) => ({ ...previous, pending: previous.pending.filter((item) => item.id !== id) })),
    [setState]
  );

  const checkout = useCallback(
    () =>
      setState((previous) => ({
        pending: [],
        purchased: [...previous.purchased, ...previous.pending],
      })),
    [setState]
  );

  return { ...state, addPending, removePending, checkout };
};
