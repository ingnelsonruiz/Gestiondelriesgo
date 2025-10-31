'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { login } from './actions';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result.success) {
      toast({
        title: '¡Bienvenido!',
        description: `Inicio de sesión exitoso como ${result.user?.razonSocial}.`,
      });
      if (result.user?.razonSocial.toUpperCase() === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Error de acceso',
        description: result.error || 'Credenciales incorrectas.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Image src="/imagenes/logo.jpg" alt="Dusakawi EPSI Logo" width={80} height={80} className="mx-auto mb-4 rounded-full" />
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Accede a la plataforma de gestión del riesgo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Usuario (Razón Social)</Label>
              <Input
                id="razonSocial"
                name="razonSocial"
                type="text"
                placeholder="Nombre del prestador"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clave">Clave de Acceso</Label>
              <Input id="clave" name="clave" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
