import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
interface User { id: number; name: string; email: string; phone: string; role: string }
const Context=createContext<{user:User|null; ready:boolean; count:number; refreshCart:()=>Promise<void>; login:(token:string,user:User)=>void; logout:()=>void; notify:(message:string)=>void}>({user:null,ready:false,count:0,refreshCart:async()=>{},login:()=>{},logout:()=>{},notify:()=>{}});
export const useShop=()=>useContext(Context);
export function ShopProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[count,setCount]=useState(0),[message,setMessage]=useState('');
  async function refreshCart(){try{const r=await api.get('/cart');setCount(r.data.data.items.reduce((s:number,i:{quantity:number})=>s+i.quantity,0));}catch{setCount(0);}}
  function logout(){sessionStorage.removeItem('kt-token');delete api.defaults.headers.common.Authorization;setUser(null);setCount(0);}
  function login(token:string,user:User){sessionStorage.setItem('kt-token',token);api.defaults.headers.common.Authorization=`Bearer ${token}`;setUser(user);void refreshCart();}
  useEffect(()=>{const token=sessionStorage.getItem('kt-token');if(!token){setReady(true);return;}api.defaults.headers.common.Authorization=`Bearer ${token}`;api.get('/auth/me').then(r=>{setUser(r.data.data);void refreshCart();}).catch(logout).finally(()=>setReady(true));},[]);
  useEffect(()=>{if(!message)return;const timeout=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timeout);},[message]);
  return <Context.Provider value={{user,ready,count,refreshCart,login,logout,notify:setMessage}}>{children}{message&&<div role="status" className="fixed bottom-5 left-5 right-5 z-50 mx-auto max-w-lg rounded-xl bg-slate-900 px-6 py-4 text-white shadow-xl" onClick={()=>setMessage('')}>{message}</div>}</Context.Provider>;
}