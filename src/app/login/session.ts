'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  const decryptedSession = await decrypt(sessionCookie);
  if (!decryptedSession || new Date(decryptedSession.expires) < new Date()) {
      cookies().set('session', '', { expires: new Date(0) });
      return null;
  }
  
  return decryptedSession.user as (import('@/lib/providers-local').Provider);
}
