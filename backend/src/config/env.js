import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
if (new URL(frontendOrigin).origin !== frontendOrigin) throw new Error('FRONTEND_ORIGIN must be a URL origin');

export const env = Object.freeze({
  port,
  host: process.env.HOST ?? '127.0.0.1',
  frontendOrigin,
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
});
