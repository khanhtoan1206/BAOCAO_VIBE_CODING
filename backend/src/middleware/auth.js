import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { fail } from '../validators/input.js';
export function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters. Run setup.');
  return value;
}
export const publicUser = { id: true, name: true, email: true, phone: true, role: true };
export async function auth(req, _res, next) {
  let payload;
  try { payload = jwt.verify(req.headers.authorization?.replace(/^Bearer /, '') || '', secret(), { algorithms: ['HS256'], issuer: 'kt-shop', audience: 'kt-shop-web' }); }
  catch { fail('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401); }
  req.user = await db.user.findUnique({ where: { id: Number(payload.sub) }, select: publicUser });
  if (!req.user) fail('Tài khoản không tồn tại.', 401);
  next();
}
export function admin(req, _res, next) { if (req.user.role !== 'ADMIN') fail('Chỉ quản trị viên được truy cập.', 403); next(); }
const attempts = new Map();
export function authLimit(req, _res, next) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const key = req.ip; const value = attempts.get(key) || { count: 0, until: now + 60000 };
  value.count++; attempts.set(key, value);
  if (value.count > 30) fail('Quá nhiều yêu cầu. Thử lại sau một phút.', 429);
  next();
}