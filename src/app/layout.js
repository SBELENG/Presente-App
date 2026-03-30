import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Presente v2.0 (Verified) — Sistema Inteligente de Asistencia Académica",
  description:
    "Digitaliza la asistencia en tu cátedra con QR, verificación de identidad y analítica académica. Rápido, confiable y moderno.",
  keywords: ["asistencia", "QR", "universidad", "cátedra", "académico"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
