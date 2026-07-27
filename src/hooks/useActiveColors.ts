import { useMemo } from "react";
import themes from "@/constants/themes";
import { useThemeStore } from "@/store/themeStore";

/**
 * Resolves the active color palette for the current theme + mode.
 * Centralizing this means every settings section reads live theme
 * colors without re-deriving `themes[theme][mode]` itself.
 */
export function useActiveColors() {
    const theme = useThemeStore((s) => s.theme);
    const mode = useThemeStore((s) => s.mode);

    return useMemo(() => themes[theme][mode], [theme, mode]);
}