"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { rehydrateAuth } from "@/redux/slices/authSlice";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  useEffect(() => {
    store.dispatch(rehydrateAuth());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}