

import { useDispatch, useSelector } from "react-redux";


import type { RootState, AppDispatch } from "./store";

// ─── HOOK 1: useAppDispatch ───────────────────────────────────────────────────

export const useAppDispatch = () => useDispatch<AppDispatch>();
//
// `() => useDispatch<AppDispatch>()`
//   → This is a function that, when called, calls useDispatch with AppDispatch
//     as the generic type argument and returns the result.
//
// `useDispatch<AppDispatch>()`
//   → The <AppDispatch> generic tells TypeScript: "the dispatch function this
//     returns is not the generic kind — it's YOUR specific dispatch that
//     understands async thunks."
//
// WHY WRAP IT IN A FUNCTION?
//   React hooks have one strict rule: they must be called inside a component
//   or another hook — never at the top level of a module.
//   If we wrote: export const dispatch = useDispatch<AppDispatch>()
//   That would call the hook at module load time → React error.
//   Wrapping it in () => ... means the hook is only called when a component
//   calls useAppDispatch() — which is always inside a component. Rule satisfied.
//
// USAGE IN A COMPONENT:
//   const dispatch = useAppDispatch()
//   dispatch(loginUser({ email, password }))    ← TypeScript: ✓
//   dispatch(logout())                          ← TypeScript: ✓
//   dispatch("random string")                  ← TypeScript: ✗ ERROR caught


// ─── HOOK 2: useAppSelector ───────────────────────────────────────────────────

export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
