'use server';

import { getLocalProviders } from '@/lib/providers-local';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from './session';

export async function login(formData: FormData) {
  const razonSocial = formData.get('razonSocial')?.toString();
  const clave = formData.get('clave')?.toString();

  if (!razonSocial || !clave) {
    return { success: false, error: 'Usuario y clave son requeridos.' };
  }

  try {
    const providers = await getLocalProviders();
    const user = providers.find(
      (p) => p.razonSocial.toUpperCase() === razonSocial.toUpperCase()
    );

    if (!user || user.clave !== clave) {
      return { success: false, error: 'Credenciales no válidas.' };
    }

    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 día
    const session = await encrypt({ user, expires });

    // Save the session in a cookie
    cookies().set('session', session, { expires, httpOnly: true });
    
    return { success: true, user: { nit: user.nit, razonSocial: user.razonSocial } };

  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: 'Ocurrió un error en el servidor.' };
  }
}


export async function logout() {
  cookies().set('session', '', { expires: new Date(0) });
  redirect('/login');
}

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  const decryptedSession = await decrypt(sessionCookie);
  if (!decryptedSession || new Date(decryptedSession.expires) < new Date()) {
      // Borrar cookie expirada
      cookies().set('session', '', { expires: new Date(0) });
      return null;
  }
  
  return decryptedSession.user as (import('@/lib/providers-local').Provider);
}