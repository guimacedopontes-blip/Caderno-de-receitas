import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';
import { createHmac } from 'node:crypto';
export const auth = createNeonAuth({baseUrl:process.env.NEON_AUTH_BASE_URL!,cookies:{secret:process.env.NEON_AUTH_COOKIE_SECRET || createHmac('sha256',process.env.DATABASE_URL!).update('caderno-receitas/auth-cookie/v1').digest('hex')}});
