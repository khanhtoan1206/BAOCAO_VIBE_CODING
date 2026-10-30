import { Router } from 'express';
import { db } from '../config/db.js';
import { listProducts, productDetail, present } from '../services/catalog.service.js';
export const catalogRouter = Router();
catalogRouter.get('/categories', async (_req, res) => res.json({ data: await db.category.findMany({ orderBy: { id: 'asc' } }) }));
catalogRouter.get('/products', async (req, res) => res.json({ data: await listProducts(req.query) }));
catalogRouter.get('/brands', async (_req,res) => res.json({data:(await db.product.findMany({where:{deleted:false,brand:{not:''}},select:{brand:true},distinct:['brand'],orderBy:{brand:'asc'}})).map(p=>p.brand)}));
catalogRouter.get('/bestsellers', async (_req,res) => {
  const ranked=await db.orderItem.groupBy({by:['productId'],where:{order:{status:'COMPLETED'},product:{deleted:false}},_sum:{quantity:true},orderBy:{_sum:{quantity:'desc'}},take:5});
  const products=await db.product.findMany({where:{id:{in:ranked.map(p=>p.productId)}},include:{category:true,reviews:{select:{rating:true}}}});
  res.json({data:ranked.map(row=>({...present(products.find(p=>p.id===row.productId)),sold:row._sum.quantity}))});
});
catalogRouter.get('/products/:id', async (req, res) => res.json({ data: await productDetail(req.params.id) }));