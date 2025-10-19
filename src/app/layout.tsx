import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "bibliAI - Oraciones, Lecturas y Reflexiones",
  description:
    "Explora la Biblia Católica con la ayuda de la inteligencia artificial. Ora con santos, recibe el versículo del día y mantén tu racha espiritual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${lora.className} antialiased`}>{children}</body>
    </html>
  );
}
