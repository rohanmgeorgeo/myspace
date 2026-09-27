"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Thin wrapper so server components can opt into `next-themes` (class based). */
export function ThemeProvider(
  props: React.ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
