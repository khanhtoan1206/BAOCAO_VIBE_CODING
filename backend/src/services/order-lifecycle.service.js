import {createHash} from 'node:crypto';
import {db} from '../config/db.js';
import {fail,integer,text} from '../validators/input.js';
import {validateShippingAddress} from './address.service.js';
export const orderInclude={items:true,history:{orderBy:{id:'asc'}}};
export const cancelReasons=[
  'Tôi muốn thay đổi địa chỉ nhận hàng.',
  'Tôi muốn thay đổi sản phẩm hoặc số lượng.',
  'Tôi muốn thay đổi phương thức thanh toán.',
  'Tôi tìm được sản phẩm có giá tốt hơn.',
  'Tôi không còn nhu cầu mua hàng.',
  'Thời gian giao hàng quá lâu.',
  'Đặt nhầm đơn hàng.',
  'Lý do khác.',
];
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function customerData(body){
  const recipient=text(body.recipient,2,100),phone=text(body.phone,8,20);
  if(!/^[+\d][\d\s().-]{7,19}$/.test(phone))fail('Số điện thoại không hợp lệ.');
  return {recipient,phone,...validateShippingAddress(body),deliveryNote:body.deliveryNote===undefined?'':text(body.deliveryNote,0,500)};
}
export function cartQuote(cart){
  if(!cart.length)fail('Giỏ hàng đang trống.');
  let subtotal=0;
  for(const item of cart){if(item.product.deleted||item.quantity<1||item.quantity>99||item.quantity>item.product.stock)fail(`${item.product.name} không đủ tồn kho.`,409);subtotal+=item.product.price*item.quantity;}
  if(!Number.isSafeInteger(subtotal)||subtotal>2147483647)fail('Tổng đơn vượt giới hạn cho phép.');
  const signature=hash(cart.map(i=>[i.id,i.productId,i.quantity,i.product.price,i.product.name]).sort((a,b)=>Number(a[0])-Number(b[0])));
  return {items:cart,subtotal,shippingFee:0,discount:0,total:subtotal,cartSignature:signature};
}
export async function quoteCheckout(userId,body){const customer=customerData(body);return {...cartQuote(await db.cartItem.findMany({where:{userId},include:{product:true},orderBy:{id:'asc'}})),customer};}
export function paymentConfig(){
  const bank=process.env.DEMO_BANK_NAME?.trim(),account=process.env.DEMO_BANK_ACCOUNT?.trim(),holder=process.env.DEMO_BANK_HOLDER?.trim();
  return {demo:true,bank:bank&&account&&holder?{name:bank,account,holder}:null,note:'Chỉ minh họa bài thực hành. Không chuyển tiền thật.',cancelReasons};
}
export async function cancelOrder(userId,id,body){
  const reasonCode=integer(body.reasonCode,1,8);
  const reason=reasonCode===8?`${cancelReasons[7]} ${text(body.details,5,500)}`:cancelReasons[reasonCode-1];
  return db.$transaction(async tx=>{
    const order=await tx.order.findFirst({where:{id:integer(id),userId},include:{items:true}});
    if(!order)fail('Không tìm thấy đơn hàng.',404);
    if(!['PENDING','PROCESSING'].includes(order.status))fail('Chỉ có thể hủy đơn chờ xác nhận hoặc đang xử lý.',409);
    const refundStatus=order.paymentStatus==='DEMO_PAID'?'DEMO_REFUNDED':order.paymentStatus==='PENDING_VERIFICATION'?'REVIEW_REQUIRED':'NONE';
    const paymentStatus=order.paymentStatus==='DEMO_PAID'?'DEMO_REFUNDED':order.paymentStatus==='PENDING_VERIFICATION'?'PENDING_VERIFICATION':'CANCELLED';
    const changed=await tx.order.updateMany({where:{id:order.id,userId,status:order.status,paymentStatus:order.paymentStatus},data:{status:'CANCELLED',cancelReason:reason,cancelledAt:new Date(),cancelledBy:userId,refundStatus,paymentStatus}});
    if(changed.count!==1)fail('Đơn hàng vừa được cập nhật. Vui lòng tải lại.',409);
    for(const item of order.items)await tx.product.update({where:{id:item.productId},data:{stock:{increment:item.quantity}}});
    await tx.orderStatusHistory.create({data:{orderId:order.id,status:'CANCELLED',actorId:userId,note:'Khách hàng hủy đơn; hoàn tồn kho một lần. '+(refundStatus==='DEMO_REFUNDED'?'Đã hoàn tiền giả lập.':refundStatus==='REVIEW_REQUIRED'?'Chuyển khoản chờ xác minh: cần đối soát, chưa xác nhận hoàn tiền.':'Không có tiền demo cần hoàn.')}});
    return tx.order.findUnique({where:{id:order.id},include:orderInclude});
  });
}
export async function transitionOrder(actorId,id,status){
  const previous={PROCESSING:'PENDING',SHIPPING:'PROCESSING',COMPLETED:'SHIPPING'}[status];
  if(!previous)fail('Trạng thái không hợp lệ.');
  return db.$transaction(async tx=>{
    const order=await tx.order.findUnique({where:{id:integer(id)}});
    if(!order)fail('Không tìm thấy đơn hàng.',404);
    if(order.status!==previous)fail('Chỉ chuyển Chờ xác nhận → Đang xử lý → Đang giao → Hoàn thành.',409);
    if(status==='SHIPPING'&&order.paymentMethod!=='COD'&&order.paymentStatus!=='DEMO_PAID')fail('Cần xác nhận thanh toán demo trước khi giao đơn trả trước.',409);
    const changed=await tx.order.updateMany({where:{id:order.id,status:previous,paymentStatus:order.paymentStatus},data:{status}});
    if(changed.count!==1)fail('Đơn hàng đã thay đổi. Vui lòng tải lại.',409);
    await tx.orderStatusHistory.create({data:{orderId:order.id,status,actorId,note:'Quản trị cập nhật trạng thái đơn hàng.'}});
    return tx.order.findUnique({where:{id:order.id},include:orderInclude});
  });
}
export async function updateDemoPayment(actorId,id,action,isAdmin=false){
  return db.$transaction(async tx=>{
    const order=await tx.order.findFirst({where:{id:integer(id),...(!isAdmin?{userId:actorId}:{})}});
    if(!order)fail('Không tìm thấy đơn hàng.',404);
    if(order.status==='CANCELLED')fail('Không thể thanh toán/xác minh đơn đã hủy. Không có giao dịch thật.',409);
    let next,note;
    if(!isAdmin&&action==='REPORT_TRANSFER'&&order.paymentMethod==='BANK_QR_DEMO'&&order.paymentStatus==='UNPAID'){next='PENDING_VERIFICATION';note='Khách báo đã chuyển khoản demo; chưa xác nhận nhận tiền.';}
    else if(!isAdmin&&action==='CONFIRM_WALLET_DEMO'&&order.paymentMethod==='WALLET_DEMO'&&order.paymentStatus==='UNPAID'){next='DEMO_PAID';note='Khách xác nhận ví giả lập; không có giao dịch tiền thật.';}
    else if(isAdmin&&action==='VERIFY_BANK_DEMO'&&order.paymentMethod==='BANK_QR_DEMO'&&order.paymentStatus==='PENDING_VERIFICATION'){next='DEMO_PAID';note='Quản trị xác minh thanh toán giả lập; không có giao dịch thật.';}
    else if(isAdmin&&action==='CONFIRM_COD_DEMO'&&order.paymentMethod==='COD'&&order.paymentStatus==='UNPAID'&&order.status==='COMPLETED'){next='DEMO_PAID';note='Quản trị xác nhận thu COD giả lập sau hoàn thành.';}
    else fail('Thao tác thanh toán không hợp lệ với trạng thái hiện tại.',409);
    const changed=await tx.order.updateMany({where:{id:order.id,status:order.status,paymentStatus:order.paymentStatus},data:{paymentStatus:next}});
    if(changed.count!==1)fail('Đơn hàng vừa thay đổi. Vui lòng tải lại.',409);
    await tx.orderStatusHistory.create({data:{orderId:order.id,status:order.status,actorId,note}});
    return tx.order.findUnique({where:{id:order.id},include:orderInclude});
  });
}