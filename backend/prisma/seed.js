import { db } from '../src/config/db.js';
const categories = ['Điện thoại', 'Laptop', 'Máy tính bảng', 'Phụ kiện'];
const products = [
  ['Nova Phone 128GB', 0, 7990000, 9490000, 20],
  ['Nova Phone Pro 256GB', 0, 14990000, 16990000, 15],
  ['Pixel View 256GB', 0, 11990000, 12990000, 12],
  ['AirBook 14 16GB / 512GB', 1, 18990000, 21990000, 8],
  ['StudioBook 15 32GB / 1TB', 1, 28990000, 31990000, 6],
  ['TravelBook 13 16GB / 512GB', 1, 15990000, 17990000, 10],
  ['Tab Air 11 Wi-Fi 128GB', 2, 6990000, 7990000, 18],
  ['Tab Studio 12 256GB', 2, 12990000, 14990000, 7],
  ['Tai nghe Wave ANC', 3, 1490000, 1990000, 35],
  ['Chuột không dây Silent', 3, 390000, 490000, 45],
  ['Bàn phím cơ Compact', 3, 1290000, 1590000, 20],
  ['Sạc nhanh USB-C 65W', 3, 590000, 790000, 30],
];
try {
  const records = [];
  for (const name of categories) records.push(await db.category.upsert({ where: { name }, update: {}, create: { name } }));
  for (const [index, [name, category, price, originalPrice, stock]] of products.entries()) {
    const id = index + 1;
    await db.product.upsert({ where: { id }, update: {}, create: {
      id, name, categoryId: records[category].id, price, originalPrice, stock,
      featured: index % 3 === 0, image: `/images/category-${category}.svg`,
      description: `${name} thuộc bộ dữ liệu demo KT-SHOP. Thiết kế hiện đại, phù hợp học tập, công việc và giải trí. Giá và thông số là dữ liệu thực hành, không phải báo giá thị trường. Bảo hành demo 12 tháng; bộ sản phẩm gồm thiết bị và hướng dẫn sử dụng.`,
    } });
  }
  console.log(`Seed complete: ${await db.category.count()} categories, ${await db.product.count()} products. Existing data preserved.`);
} finally { await db.$disconnect(); }