import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jeremiah Baccam — Software Engineer",
  description:
    "Software engineer at Capital One. Ex–John Deere. I ride fast and ship faster — cooking, cats, family, cars, and motorcycles in between.",
  openGraph: {
    title: "Jeremiah Baccam — Software Engineer",
    description: "I ride fast and ship faster.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable}`}>
      <body>
        {children}
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
