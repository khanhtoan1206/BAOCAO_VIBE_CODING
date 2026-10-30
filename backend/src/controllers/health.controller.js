import { getHealth } from '../services/health.service.js';

export async function healthController(_request, response) {
  response.set('Cache-Control', 'no-store').json({ data: await getHealth() });
}