
import type { Metadata } from 'next';
import './globals.css';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarGroup, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, BarChart3, PanelLeft, FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fontSans = FontSans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'Gestión del Riesgo - Fenix',
  description: 'Plataforma para la gestión de indicadores de riesgo en salud.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning={true} className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <SidebarProvider>
            <Sidebar side="left" variant="sidebar" collapsible="icon">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Inicio">
                                    <Link href="/">
                                        <Home />
                                        <span>Inicio</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Informes Fenix">
                                    <Link href="/informes-fenix">
                                        <BarChart3 />
                                        <span>Informes Fenix</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Ayuda">
                                    <Link href="/ayuda">
                                        <FileQuestion />
                                        <span>Ayuda</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <SidebarTrigger className="md:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Abrir/Cerrar Menú</span>
                    </SidebarTrigger>
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
