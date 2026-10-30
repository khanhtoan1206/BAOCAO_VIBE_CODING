import { CheckoutForm } from '../components/CheckoutForm';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useShop } from '../contexts/ShopContext';
import { money, type Product } from '../types/shop';
import { errorMessage } from '../utils/error';
export function CartPage(){
  const shop=useShop();const [cart,setCart]=useState<{items:{id:number;quantity:number;product:Product}[];total:number}>({items:[],total:0}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function load(){setError('');try{setCart((await api.get('/cart')).data.data);}catch(e){setError(errorMessage(e));}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);
  async function update(id:number,quantity?:number){setBusy(true);try{quantity===undefined?await api.delete(`/cart/${id}`):await api.patch(`/cart/${id}`,{quantity});await load();await shop.refreshCart();}catch(e){shop.notify(errorMessage(e));}finally{setBusy(false);}}
  if(loading)return <div className="panel animate-pulse">Đang tải giỏ hàng…</div>;
  if(error)return <div role="alert" className="panel">{error}<button className="btn" onClick={load}>Thử lại</button></div>;
  return <><h1 className="mb-6 text-3xl font-extrabold">Giỏ hàng của bạn</h1>{!cart.items.length?<div className="panel text-center"><p>Giỏ hàng đang trống.</p><Link to="/" className="btn mt-5">Khám phá sản phẩm</Link></div>:<div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="space-y-4">{cart.items.map(i=><div key={i.id} className="panel flex flex-wrap items-center gap-4"><img src={i.product.image} alt={i.product.name} className="h-20 w-20 object-contain"/><div className="min-w-36 flex-1"><Link to={`/products/${i.product.id}`} className="font-bold">{i.product.name}</Link><p className="mt-2 text-blue-600">{money(i.product.price)}</p><p className="text-xs text-slate-500">Tồn kho: {i.product.stock}</p></div><div className="flex items-center gap-3"><button className="btn-secondary" aria-label="Giảm số lượng" disabled={busy||i.quantity<=1} onClick={()=>update(i.id,i.quantity-1)}>−</button><span>{i.quantity}</span><button className="btn-secondary" aria-label="Tăng số lượng" disabled={busy||i.quantity>=i.product.stock||i.quantity>=99} onClick={()=>update(i.id,i.quantity+1)}>+</button></div><button aria-label={`Xóa ${i.product.name}`} className="text-red-500" disabled={busy} onClick={()=>update(i.id)}><Trash2 size={20}/></button></div>)}</div><div className="panel h-fit"><h2 className="text-xl font-bold">Thông tin đặt hàng</h2><p className="my-5 flex justify-between border-b border-slate-100 pb-5"><span>Tổng tiền</span><strong className="text-xl text-blue-600">{money(cart.total)}</strong></p><CheckoutForm busy={busy} setBusy={setBusy} onError={load}/></div></div>}</>;
}