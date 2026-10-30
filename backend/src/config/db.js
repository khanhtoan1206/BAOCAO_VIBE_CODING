import './env.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const base = fileURLToPath(new URL('../../', import.meta.url));
const configured = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const url = `file:${resolve(base, configured.replace(/^file:/, ''))}`;
export const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });