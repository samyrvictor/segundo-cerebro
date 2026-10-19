import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { PomodoroProvider } from "@/components/Pomodoro";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

// Inter: a mais próxima da SF Pro da Apple que pode ser usada na web.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Segundo Cérebro",
  description: "Rotina, estudos, quadro e notas — espelhados no seu Obsidian.",
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full bg-background text-foreground">
        <PomodoroProvider>
          <Sidebar />
          <main className="min-h-screen flex-1 overflow-x-hidden">{children}</main>
        </PomodoroProvider>
      </body>
    </html>
  );
}
