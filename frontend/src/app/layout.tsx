import type { Metadata } from "next";

import ThemeSync from "@/components/ThemeSync";
import ThemeToggle from "@/components/ThemeToggle";

import "./globals.css";

export const metadata: Metadata = {
  title: "Finanzas personales",
  description: "Registro de ingresos y egresos",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps): React.JSX.Element => {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body>
        <ThemeSync />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
