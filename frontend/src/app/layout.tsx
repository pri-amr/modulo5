import type { Metadata } from "next";

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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
