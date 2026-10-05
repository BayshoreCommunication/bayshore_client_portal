"use client";

import { useCallback } from "react";
import { useLocalStore } from "@/lib/local-store";

// What the client has ticked to add, kept in this browser so it survives the trip
// from the Services page to the payment page (and a reload on either).
// Service id → the ids of the sub-services to add.
export type ServiceCart = Record<string, string[]>;

const STORAGE_KEY = "bayshore_service_cart";
const EMPTY_CART: ServiceCart = {};

export const useServiceCart = () => {
  const [cart, setCart] = useLocalStore<ServiceCart>(STORAGE_KEY, EMPTY_CART);
  const clearCart = useCallback(() => setCart({}), [setCart]);

  return { cart, setCart, clearCart };
};
