import { Router } from 'express';
import { db } from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { fail, integer, text } from '../validators/input.js';
import { checkout } from '../services/order.service.js';
import {quoteCheckout,paymentConfig,orderInclude,cancelOrder,updateDemoPayment} from '../services/order-lifecycle.service.js';
export const shopRouter = Router();
shopRouter.use(auth);
shopRouter.get('/cart', async (req,res) => {
  const items = await db.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true }, orderBy: { id: 'asc' } });
  res.json({ data: { items, total: items.reduce((s,i) => s+i.quantity*i.product.price,0) } });
});
shopRouter.post('/cart', async (req,res) => {
  const productId=integer(req.body.productId), quantity=integer(req.body.quantity ?? 1,1,99);
  const line=await db.$transaction(async tx=>{
    const product=await tx.product.findFirst({where:{id:productId,deleted:false}});
    if(!product) fail('Sản phẩm không tồn tại.',404);
    const existing=await tx.cartItem.findUnique({where:{userId_productId:{userId:req.user.id,productId}}});
    const next=(existing?.quantity||0)+quantity;
    if(next>product.stock||next>99) fail('Số lượng vượt tồn kho hoặc giới hạn 99.',409);
    return tx.cartItem.upsert({where:{userId_productId:{userId:req.user.id,productId}},create:{userId:req.user.id,productId,quantity:next},update:{quantity:next}});
  });
  res.status(201).json({data:line});
});
shopRouter.patch('/cart/:id',async(req,res)=>{
  const id=integer(req.params.id), quantity=integer(req.body.quantity,1,99);
  const item=await db.cartItem.findFirst({where:{id,userId:req.user.id},include:{product:true}});
  if(!item)fail('Không tìm thấy dòng giỏ hàng.',404);
  if(item.product.deleted||quantity>item.product.stock)fail('Không đủ tồn kho.',409);
  res.json({data:await db.cartItem.update({where:{id},data:{quantity}})});
});
shopRouter.delete('/cart/:id',async(req,res)=>{await db.cartItem.deleteMany({where:{id:integer(req.params.id),userId:req.user.id}});res.status(204).end();});
shopRouter.post('/orders',async(req,res)=>res.status(201).json({data:await checkout(req.user.id,req.body)}));
shopRouter.post('/orders/quote',async(req,res)=>res.json({data:await quoteCheckout(req.user.id,req.body)}));
shopRouter.get('/orders/payment-config',(_req,res)=>res.json({data:paymentConfig()}));
shopRouter.get(['/orders','/orders/my'],async(req,res)=>res.json({data:await db.order.findMany({where:{userId:req.user.id},include:orderInclude,orderBy:{id:'desc'}})}));
shopRouter.get('/orders/:id',async(req,res)=>{const order=await db.order.findFirst({where:{id:integer(req.params.id),userId:req.user.id},include:orderInclude});if(!order)fail('Không tìm thấy đơn hàng.',404);res.json({data:order});});
shopRouter.patch('/orders/:id/cancel',async(req,res)=>res.json({data:await cancelOrder(req.user.id,req.params.id,req.body)}));
shopRouter.patch('/orders/:id/payment',async(req,res)=>res.json({data:await updateDemoPayment(req.user.id,req.params.id,req.body.action)}));
shopRouter.post('/products/:id/reviews',async(req,res)=>{
  const productId=integer(req.params.id);const rating=integer(req.body.rating,1,5),comment=text(req.body.comment,3,1000);
  if(!await db.product.findFirst({where:{id:productId,deleted:false}}))fail('Sản phẩm không tồn tại.',404);
  res.status(201).json({data:await db.review.upsert({where:{userId_productId:{userId:req.user.id,productId}},create:{userId:req.user.id,productId,rating,comment},update:{rating,comment}})});
});