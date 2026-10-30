import { db } from '../src/config/db.js';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
try {
  const email='admin@kt-shop.local';
  if(await db.user.findUnique({where:{email}})){console.log('Admin account already exists. Password unchanged.');}
  else {
    const password=randomBytes(15).toString('base64url');
    await db.user.create({data:{email,name:'Quản trị KT-SHOP',phone:'0900000000',role:'ADMIN',password:await bcrypt.hash(password,12)}});
    await writeFile(new URL('../.admin-credentials.txt',import.meta.url),`Local demo admin\nEmail: ${email}\nPassword: ${password}\nDo not commit or share this file.\n`,{flag:'wx'});
    console.log('Created local admin. Credentials saved to backend/.admin-credentials.txt (gitignored).');
  }
} finally {await db.$disconnect();}