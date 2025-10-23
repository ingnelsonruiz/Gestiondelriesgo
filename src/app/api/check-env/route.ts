
import { NextResponse } from 'next/server';

export async function GET() {
  const isSet = !!process.env.GEMINI_API_KEY;
  return NextResponse.json({ isSet });
}
