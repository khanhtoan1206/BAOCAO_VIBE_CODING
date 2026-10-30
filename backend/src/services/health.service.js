import { db } from '../config/db.js';
export async function getHealth() {
  await db.$queryRaw`SELECT 1`;
  return {
    status: 'ok',
    service: 'kt-shop-api',
    phase: 7,
    database: 'connected',
    timestamp: new Date().toISOString(),
  };
}