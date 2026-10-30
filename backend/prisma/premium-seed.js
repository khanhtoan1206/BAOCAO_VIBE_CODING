import { db } from '../src/config/db.js';
import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../../frontend/public/images/', import.meta.url);
const groups = [
  ['Điện thoại',30,['Apple','Samsung','Xiaomi','OPPO'],'phone',4500000],
  ['Laptop',25,['ASUS','Lenovo','Dell','HP','Acer'],'laptop',12500000],
  ['Máy tính bảng',15,['Apple','Samsung','Xiaomi'],'tablet',6500000],
  ['Tai nghe',20,['Sony','Apple','Samsung','Logitech'],'audio',850000],
  ['Sạc, cáp và pin dự phòng',15,['Samsung','Xiaomi','OPPO'],'charging',190000],
  ['Bàn phím, chuột và phụ kiện máy tính',15,['Logitech','ASUS','Lenovo'],'peripheral',350000],
];
function illustration(kind,name,color,alternate){
  const shapes={
    phone:'<rect x="150" y="55" width="140" height="250" rx="26" fill="#0f172a"/><rect x="159" y="65" width="122" height="229" rx="19" fill="url(#s)"/><rect x="194" y="74" width="52" height="12" rx="6" fill="#0f172a"/>',
    tablet:'<rect x="100" y="65" width="240" height="230" rx="20" fill="#0f172a"/><rect x="110" y="75" width="220" height="210" rx="12" fill="url(#s)"/>',
    laptop:'<rect x="72" y="75" width="296" height="190" rx="15" fill="#0f172a"/><rect x="83" y="86" width="274" height="166" rx="6" fill="url(#s)"/><path d="M72 265h296l35 30H37z" fill="#94a3b8"/>',
    audio:'<path d="M125 210v-55a95 95 0 01190 0v55" fill="none" stroke="#0f172a" stroke-width="27"/><rect x="105" y="175" width="65" height="105" rx="26" fill="url(#s)"/><rect x="270" y="175" width="65" height="105" rx="26" fill="url(#s)"/>',
    charging:'<rect x="145" y="100" width="150" height="155" rx="30" fill="url(#s)"/><path d="M190 100V65m60 35V65" stroke="#64748b" stroke-width="15"/><path d="M222 135l-25 48h27l-8 39 32-54h-30z" fill="white"/>',
    peripheral:`<rect x="45" y="125" width="270" height="140" rx="18" fill="#0f172a"/><path d="M65 150h230M65 178h230M65 206h230M90 145v70m40-70v70m40-70v70m40-70v70m40-70v70" stroke="${color}" stroke-width="10"/><rect x="335" y="125" width="65" height="120" rx="32" fill="url(#s)"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 360"><defs><linearGradient id="s" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="440" height="360" rx="24" fill="${alternate?'#e0e7ff':'#f1f5f9'}"/><circle cx="220" cy="180" r="145" fill="${color}" opacity=".09"/><g transform="${alternate?'translate(440 0) scale(-1 1)':''}">${shapes[kind]}</g><text x="220" y="328" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#334155">${name}</text><text x="220" y="346" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#64748b">Ảnh minh họa demo · Không phải ảnh sản phẩm thực</text></svg>`;
}
try{
  await mkdir(directory,{recursive:true});
  for(const [categoryName,count,brands,kind,base] of groups){
    const category=await db.category.upsert({where:{name:categoryName},update:{},create:{name:categoryName}});
    for(let i=0;i<count;i++){
      const brand=brands[i%brands.length],slug=`kt-demo-${kind}-${String(i+1).padStart(2,'0')}`;
      const label=kind==='laptop'?(i<12?'Laptop Gaming':'Laptop Văn phòng'):categoryName.split(',')[0];
      const name=`${brand} ${label} · Demo ${String(i+1).padStart(2,'0')}`;
      const price=base+i*110000,images=[`/images/${slug}.svg`,`/images/${slug}-detail.svg`];
      for(const [index,image] of images.entries()) await writeFile(new URL(image.split('/').at(-1),directory),illustration(kind,name,['#2563eb','#7c3aed','#ec4899','#06b6d4','#f97316'][i%5],index===1));
      const specifications={'Nguồn dữ liệu':'Demo chưa xác minh, không phải cấu hình thương mại','Thương hiệu tham khảo':brand,'Mã mẫu':slug,'Nhóm thiết bị':categoryName};
      if(['phone','tablet','laptop'].includes(kind)){specifications['Bộ nhớ (demo)']=kind==='laptop'?'16 GB RAM / SSD 512 GB':'128 GB';specifications['Màu cố định (demo)']=['Xanh','Tím','Đen','Bạc'][i%4];}
      else specifications['Kết nối (demo)']=kind==='charging'?'USB-C':'Không dây';
      await db.product.upsert({where:{slug},update:{},create:{slug,name,brand,categoryId:category.id,price,originalPrice:price+Math.round(price*.15/10000)*10000,stock:i%11===0?0:10+i,featured:i%4===0,demo:true,segment:kind==='laptop'?(i<12?'gaming':'office'):kind,image:images[0],gallery:JSON.stringify(images),specifications:JSON.stringify(specifications),warranty:'Bảo hành demo 12 tháng; chưa phải chính sách kinh doanh được xác nhận.',description:`${name} là sản phẩm giả định để trình diễn KT-SHOP, không đại diện cho model chính thức của ${brand}. Giá, cấu hình, tồn kho, ảnh minh họa và chính sách là dữ liệu demo chưa xác minh. Thiết bị thuộc nhóm ${categoryName}, dùng minh họa trải nghiệm tìm kiếm và đặt hàng. Mỗi mẫu có một cấu hình cố định, không có lựa chọn phiên bản giả.`}});
    }
  }
  console.log(`Seed an toàn: ${await db.product.count({where:{demo:true}})} sản phẩm demo; tổng ${await db.product.count()}. Giữ nguyên dữ liệu đã tồn tại.`);
}finally{await db.$disconnect();}