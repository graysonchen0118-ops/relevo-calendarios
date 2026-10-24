import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: { default: "Relevo | Traspaso de Airbnb a Smoobu", template: "%s | Relevo" },
  description: "Inventario, emparejado, bloqueos, tarifas, conexión y cuadre de una cartera de alquiler por noches que pasa de Airbnb a Smoobu.",
};

export const viewport: Viewport = {
  themeColor: "#f6f2ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={nunito.className}>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
