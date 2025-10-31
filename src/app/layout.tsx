
import type { Metadata } from 'next';
import './globals.css';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, BarChart3, PanelLeft, FileQuestion, Server, ShieldCheck, Link2, FileCheck2, LogOut, UserCog, FolderArchive } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from './footer';
import Image from 'next/image';
import { getSession, logout } from './login/actions';

const fontSans = FontSans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'Gestión del Riesgo - Fenix',
  description: 'Plataforma para la gestión de indicadores de riesgo en salud.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getSession();
  const isAdmin = session?.razonSocial.toUpperCase() === 'ADMIN';

  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning={true} className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        { !session ? (
          <>{children}</>
        ) : (
          <SidebarProvider>
              <Sidebar side="left" variant="sidebar" collapsible="icon">
                  <SidebarHeader>
                    <Link href="/" className="flex items-center gap-2 justify-center py-2">
                      <Image src="/imagenes/logo.jpg" alt="Dusakawi EPSI Logo" width={32} height={32} className="rounded-full" />
                      <span className="font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">DUSAKAWI</span>
                    </Link>
                  </SidebarHeader>
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
                                  <SidebarMenuButton asChild tooltip="Módulo Gestantes">
                                      <Link href="/modulo-gestantes">
                                          <FileCheck2 />
                                          <span>Módulo Gestantes</span>
                                      </Link>
                                  </SidebarMenuButton>
                              </SidebarMenuItem>
                               <SidebarMenuItem>
                                  <SidebarMenuButton asChild tooltip="Módulo RCV">
                                      <Link href="/modulo-rcv">
                                          <ShieldCheck />
                                          <span>Módulo RCV</span>
                                      </Link>
                                  </SidebarMenuButton>
                              </SidebarMenuItem>
                              {isAdmin && (
                                <>
                                  <SidebarMenuItem>
                                      <SidebarMenuButton asChild tooltip="Administración">
                                          <Link href="/admin">
                                              <UserCog />
                                              <span>Usuarios</span>
                                          </Link>
                                      </SidebarMenuButton>
                                  </SidebarMenuItem>
                                  <SidebarMenuItem>
                                      <SidebarMenuButton asChild tooltip="Gestor de Archivos">
                                          <Link href="/admin/file-manager">
                                              <FolderArchive />
                                              <span>Archivos</span>
                                          </Link>
                                      </SidebarMenuButton>
                                  </SidebarMenuItem>
                                </>
                              )}
                               <SidebarMenuItem>
                                  <SidebarMenuButton asChild tooltip="Diagnóstico IA">
                                      <Link href="/tools/list-models">
                                          <Server />
                                          <span>Diagnóstico IA</span>
                                      </Link>
                                  </SidebarMenuButton>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                  <SidebarMenuButton asChild tooltip="Verificar Conexión">
                                      <Link href="/tools/google-sheets-checker">
                                          <Link2 />
                                          <span>Verificar Conexión</span>
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
                   <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <form action={logout}>
                                    <SidebarMenuButton type="submit" tooltip="Cerrar Sesión">
                                        <LogOut />
                                        <span>Cerrar Sesión</span>
                                    </SidebarMenuButton>
                                </form>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset className="flex flex-col min-h-screen">
                  <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                      <SidebarTrigger className="md:hidden" />
                      <div className="flex-1 text-right">
                          <span className="text-sm font-medium text-muted-foreground">
                            Usuario: <strong>{session.razonSocial}</strong>
                          </span>
                      </div>
                  </header>
                  <div className="flex-1">
                   {children}
                  </div>
                  <Footer />
              </SidebarInset>
          </SidebarProvider>
        )}
      </body>
    </html>
  );
}
