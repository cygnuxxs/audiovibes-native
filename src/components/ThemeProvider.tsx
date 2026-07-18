import themes from "@/constants/themes";
import { VariableContextProvider } from "nativewind";
import React from "react";

const ThemeProvider = ({
  name,
  colorScheme,
  children,
}: {
  name: keyof typeof themes;
  colorScheme: "light" | "dark";
  children: React.ReactNode;
}) => {
  return (
    <VariableContextProvider value={themes[name][colorScheme]}>
      {children}
    </VariableContextProvider>
  );
};

export default ThemeProvider;
