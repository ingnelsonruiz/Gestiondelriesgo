import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <FileQuestion className="h-16 w-16 text-primary" />
          <h1 className="text-6xl font-bold text-primary">404</h1>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          ¡Uy! Página No Encontrada.
        </h2>
        <p className="max-w-md text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    </div>
  );
}
