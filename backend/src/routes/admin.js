import { Router } from 'express';
import { db } from '../config/db.js';
import { auth, admin } from '../middleware/auth.js';
import { integer, text, fail } from '../validators/input.js';
import {orderInclude,transitionOrder,updateDemoPayment} from '../services/order-lifecycle.service.js';
export const adminRouter=Router();adminRouter.use(auth,admin);
adminRouter.get('/dashboard',async(_req,res)=>{
  const [orders,customers,revenue,recent]=await Promise.all([db.order.count(),db.user.count({where:{role:'USER'}}),db.order.aggregate({where:{status:'COMPLETED'},_sum:{total:true}}),db.order.findMany({where:{status:'COMPLETED'},select:{createdAt:true,total:true}})]);
  const grouped={};for(const o of recent){const day=o.createdAt.toISOString().slice(0,10);grouped[day]=(grouped[day]||0)+o.total;}
  res.json({data:{orders,customers,cancelledOrders:await db.order.count({where:{status:'CANCELLED'}}),revenue:revenue._sum.total||0,chart:Object.entries(grouped).sort().map(([date,revenue])=>({date,revenue}))}});
});
adminRouter.get('/products',async(_req,res)=>res.json({data:await db.product.findMany({where:{deleted:false},include:{category:true},orderBy:{id:'desc'}})}));
adminRouter.get('/customers',async(_req,res)=>res.json({data:await db.user.findMany({where:{role:'USER'},select:{id:true,name:true,email:true,phone:true,createdAt:true,_count:{select:{orders:true}}},orderBy:{id:'desc'}})}));
function productData(body){
  const price=integer(body.price,0),originalPrice=integer(body.originalPrice,0);if(originalPrice<price)fail('Giá gốc không được thấp hơn giá bán.');
  const image=text(body.image,1,1000);if(!/^\/images\/[a-zA-Z0-9_.-]+$/.test(image)&&!/^https:\/\//.test(image))fail('Ảnh phải là HTTPS URL hoặc đường dẫn /images/.');
  return {name:text(body.name,2,200),description:text(body.description,10,5000),image,price,originalPrice,stock:integer(body.stock,0,100000),categoryId:integer(body.categoryId),featured:body.featured===true};
}
adminRouter.post('/products',async(req,res)=>res.status(201).json({data:await db.product.create({data:productData(req.body)})}));
adminRouter.put('/products/:id',async(req,res)=>res.json({data:await db.product.update({where:{id:integer(req.params.id)},data:productData(req.body)})}));
adminRouter.delete('/products/:id',async(req,res)=>{await db.product.update({where:{id:integer(req.params.id)},data:{deleted:true}});res.status(204).end();});
adminRouter.post('/categories',async(req,res)=>res.status(201).json({data:await db.category.create({data:{name:text(req.body.name,2,100)}})}));
adminRouter.put('/categories/:id',async(req,res)=>res.json({data:await db.category.update({where:{id:integer(req.params.id)},data:{name:text(req.body.name,2,100)}})}));
adminRouter.delete('/categories/:id',async(req,res)=>{await db.category.delete({where:{id:integer(req.params.id)}});res.status(204).end();});
adminRouter.get('/orders',async(req,res)=>{
  if(req.query.status&&!['PENDING','PROCESSING','SHIPPING','COMPLETED','CANCELLED'].includes(req.query.status))fail('Bộ lọc trạng thái không hợp lệ.');
  res.json({data:await db.order.findMany({where:req.query.status?{status:req.query.status}:{},include:{...orderInclude,user:{select:{name:true,email:true}}},orderBy:{id:'desc'}})});
});
adminRouter.patch('/orders/:id/status',async(req,res)=>{
  res.json({data:await transitionOrder(req.user.id,req.params.id,req.body.status)});
});
adminRouter.patch('/orders/:id/payment',async(req,res)=>res.json({data:await updateDemoPayment(req.user.id,req.params.id,req.body.action,true)}));