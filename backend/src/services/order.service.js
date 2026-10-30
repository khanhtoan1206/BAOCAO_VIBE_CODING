import { db } from '../config/db.js';
import { fail, text } from '../validators/input.js';
import {customerData,cartQuote,hash,orderInclude} from './order-lifecycle.service.js';
export async function checkout(userId, body) {
  const customer=customerData(body);
  const legacy=body.paymentMethod===undefined;
  const payment=body.payment ?? 'SIMULATED_PAID';
  if(legacy&&!['SIMULATED_PAID','COD'].includes(payment))fail('Phương thức thanh toán không hợp lệ.');
  const paymentMethod=legacy?(payment==='COD'?'COD':'WALLET_DEMO'):body.paymentMethod;
  if(!['COD','BANK_QR_DEMO','WALLET_DEMO'].includes(paymentMethod))fail('Phương thức thanh toán không hợp lệ.');
  const key=body.idempotencyKey===undefined?null:text(body.idempotencyKey,16,100);
  if(!legacy&&!key)fail('Thiếu khóa chống đặt trùng. Vui lòng tải lại checkout.');
  if(!legacy&&(typeof body.cartSignature!=='string'||!/^[a-f0-9]{64}$/.test(body.cartSignature)))fail('Vui lòng xác nhận lại giỏ hàng.');
  const requestHash=hash({customer,paymentMethod,cartSignature:body.cartSignature??null});
  if (body.confirmPayment !== true) fail('Vui lòng xác nhận đặt hàng.');
  const existing=key?await db.order.findUnique({where:{userId_idempotencyKey:{userId,idempotencyKey:key}},include:orderInclude}):null;
  if(existing){if(existing.requestHash!==requestHash)fail('Khóa đặt hàng đã được dùng với thông tin khác.',409);return existing;}
  try{return await db.$transaction(async tx => {
    if(key){const prior=await tx.order.findUnique({where:{userId_idempotencyKey:{userId,idempotencyKey:key}},include:orderInclude});if(prior){if(prior.requestHash!==requestHash)fail('Khóa đặt hàng đã được dùng với thông tin khác.',409);return prior;}}
    const cart = await tx.cartItem.findMany({ where: { userId }, include: { product: true } });
    const quote=cartQuote(cart);
    if(!legacy&&quote.cartSignature!==body.cartSignature)fail('Giỏ hàng hoặc giá đã thay đổi. Vui lòng xem lại và xác nhận lần nữa.',409);
    let total = 0;
    for (const line of cart) {
      const changed = await tx.product.updateMany({ where: { id: line.productId, deleted: false, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
      if (changed.count !== 1) fail(`${line.product.name} không đủ tồn kho.`, 409);
      total += line.product.price * line.quantity;
    }
    if (!Number.isSafeInteger(total) || total > 2147483647) fail('Tổng đơn hàng vượt giới hạn cho phép.');
    const status=legacy?'PROCESSING':'PENDING';
    const order = await tx.order.create({ data: { userId,...customer,total,subtotal:total,payment:legacy?payment:paymentMethod,paymentMethod,paymentStatus:legacy&&payment==='SIMULATED_PAID'?'DEMO_PAID':'UNPAID',status,idempotencyKey:key,requestHash,items: { create: cart.map(line => ({ productId: line.productId, name: line.product.name,image:line.product.image, price: line.product.price, quantity: line.quantity })) },history:{create:{status,actorId:userId,note:'Đặt hàng thành công. '+(legacy?'Luồng API tương thích cũ.':'Đang chờ quản trị xác nhận.')}} }, include:orderInclude });
    await tx.cartItem.deleteMany({ where: { userId } });
    return order;
  });}catch(error){if(key){const prior=await db.order.findUnique({where:{userId_idempotencyKey:{userId,idempotencyKey:key}},include:orderInclude});if(prior&&prior.requestHash===requestHash)return prior;}throw error;}
}