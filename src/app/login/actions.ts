'use server';

import { getLocalProviders } from '@/lib/providers-local'; // Se cambia la importación a la nueva función local
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-for-development';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Token válido por 1 día
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (e) {
    console.error('Failed to decrypt session:', e);
    return null;
  }
}

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
