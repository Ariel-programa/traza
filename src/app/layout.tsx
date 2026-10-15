import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base para las URLs absolutas de Open Graph / canonical
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "TRAZA — Todo bajo control",
  description:
    "Plataforma de gestión, trazabilidad y operaciones empresariales: activos, mantenimiento, proveedores, documentación, flota y logística en un solo lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--surface-muted)] text-[var(--foreground)]">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
