import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Planner iRacing — 2026 Season 4",
  description:
    "Busca, filtros e planejamento de temporada em cima do schedule oficial do iRacing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <StoreProvider>
          <Nav />
          <main>{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
