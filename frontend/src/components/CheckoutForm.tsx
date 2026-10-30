import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {api} from '../services/api';
import {useShop} from '../contexts/ShopContext';
import {errorMessage} from '../utils/error';
import {AddressPicker,emptyShippingAddress,shippingErrors,shippingPayload,type ShippingAddress} from './AddressPicker';
export function CheckoutForm({busy,setBusy,onError}:{busy:boolean;setBusy:(busy:boolean)=>void;onError:()=>Promise<void>}){
  const shop=useShop(),navigate=useNavigate();
  const [shipping,setShipping]=useState<ShippingAddress>({...emptyShippingAddress}),[errors,setErrors]=useState<Record<string,string>>({}),[submitted,setSubmitted]=useState(false);
  function change(value:ShippingAddress){setShipping(value);setErrors(submitted?shippingErrors(value):{});}
  return <form className="space-y-4 checkout-form" noValidate onSubmit={async e=>{
    e.preventDefault();if(busy)return;setSubmitted(true);
    const form=e.currentTarget,body=Object.fromEntries(new FormData(form)),validation=shippingErrors(shipping);setErrors(validation);
    if(Object.keys(validation).length){requestAnimationFrame(()=>form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());return;}
    if(!form.reportValidity())return;
    setBusy(true);
    try{const result=await api.post('/orders',{recipient:body.recipient,phone:body.phone,payment:body.payment,...shippingPayload(shipping),confirmPayment:true});await shop.refreshCart();shop.notify('Đơn hàng đã được ghi nhận.');navigate(`/orders/${result.data.data.id}/success`);}
    catch(error){if(axios.isAxiosError(error)&&error.response?.data?.error?.fields)setErrors(error.response.data.error.fields);shop.notify(errorMessage(error));await onError();}
    finally{setBusy(false);}
  }}><fieldset disabled={busy} className="space-y-4"><label className="block text-sm">Người nhận <span className="text-rose-600">*</span><input name="recipient" autoComplete="name" required minLength={2} maxLength={100} defaultValue={shop.user?.name}/></label><label className="block text-sm">Số điện thoại <span className="text-rose-600">*</span><input name="phone" type="tel" autoComplete="tel" required minLength={8} maxLength={20} defaultValue={shop.user?.phone}/></label><AddressPicker value={shipping} onChange={change} errors={errors} disabled={busy}/><label className="block text-sm">Phương thức thanh toán<select name="payment" className="w-full"><option value="SIMULATED_PAID">Thanh toán giả lập — không thu tiền thật</option><option value="COD">COD — thanh toán khi nhận hàng (demo)</option></select></label><label className="flex items-start gap-2 text-sm text-slate-600"><input name="confirm" type="checkbox" required className="mt-1 w-auto"/>Tôi đã kiểm tra địa chỉ và xác nhận đặt hàng. Không phát sinh giao dịch tiền thật trên website demo.</label><button disabled={busy} className="btn w-full" type="submit">{busy?'Đang xử lý…':'Xác nhận đặt hàng'}</button></fieldset></form>;
}