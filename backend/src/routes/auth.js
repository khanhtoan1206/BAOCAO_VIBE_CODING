import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { auth, authLimit, publicUser, secret } from '../middleware/auth.js';
import { text, fail } from '../validators/input.js';
export const authRouter = Router();
function credentials(body) {
  const email = text(body.email, 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Email không hợp lệ.');
  const password = body.password;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) fail('Mật khẩu tối thiểu 8 ký tự, tối đa 72 byte.');
  return { email, password };
}
function session(user) {
  const { password, ...safe } = user;
  return { user: safe, token: jwt.sign({}, secret(), { algorithm: 'HS256', subject: String(user.id), expiresIn: '8h', issuer: 'kt-shop', audience: 'kt-shop-web' }) };
}
authRouter.post('/register', authLimit, async (req, res) => {
  const { email, password } = credentials(req.body || {});
  if (req.body.confirmPassword !== password) fail('Mật khẩu xác nhận không khớp.');
  const name = text(req.body.name, 2, 100); const phone = text(req.body.phone, 8, 20);
  if (!/^[+\d\s()-]+$/.test(phone)) fail('Số điện thoại không hợp lệ.');
  const user = await db.user.create({ data: { email, name, phone, password: await bcrypt.hash(password, 12) }, select: publicUser });
  res.status(201).json({ data: session(user) });
});
authRouter.post('/login', authLimit, async (req, res) => {
  const { email, password } = credentials(req.body || {});
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) fail('Email hoặc mật khẩu không đúng.', 401);
  const { createdAt, ...safe } = user;
  res.json({ data: session(safe) });
});
authRouter.get('/me', auth, (req, res) => res.json({ data: req.user }));