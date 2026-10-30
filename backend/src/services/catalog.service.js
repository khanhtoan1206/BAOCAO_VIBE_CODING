import { db } from '../config/db.js';
import { integer, fail } from '../validators/input.js';
export function present(product) {
  const { reviews, ...rest } = product;
  return { ...rest, rating: reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0, reviewCount: reviews.length };
}
export async function listProducts(query) {
  const page = integer(query.page ?? 1, 1, 100000);
  const limit = integer(query.limit ?? 8, 1, 48);
  const min = integer(query.min ?? 0, 0);
  const max = integer(query.max ?? 2147483647, 0);
  if (min > max) fail('Giá tối thiểu không được lớn hơn giá tối đa.');
  const where = { deleted: false, price: { gte: min, lte: max } };
  if (query.q) { if (typeof query.q !== 'string' || query.q.length > 100) fail('Từ khóa không hợp lệ.'); where.OR = [{name:{contains:query.q.trim()}},{brand:{contains:query.q.trim()}}]; }
  if (query.brand) { if(typeof query.brand !== 'string' || query.brand.length > 100) fail('Thương hiệu không hợp lệ.'); where.brand = query.brand; }
  if (query.segment) { if(typeof query.segment !== 'string' || query.segment.length > 100) fail('Phân nhóm không hợp lệ.'); where.segment = query.segment; }
  if (query.stock === 'in') where.stock = {gt:0};
  else if (query.stock === 'out') where.stock = 0;
  else if (query.stock) fail('Tình trạng hàng không hợp lệ.');
  if (query.sale === 'true') where.price.lt = db.product.fields.originalPrice;
  if (query.category) where.categoryId = integer(query.category);
  if (query.featured === 'true') where.featured = true;
  const sorts = { newest: { createdAt: 'desc' }, price_asc: { price: 'asc' }, price_desc: { price: 'desc' }, name_asc: {name:'asc'}, name_desc:{name:'desc'} };
  if (query.sort && !sorts[query.sort]) fail('Kiểu sắp xếp không hợp lệ.');
  const [total, products] = await db.$transaction([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy: [sorts[query.sort] || sorts.newest, { id: 'desc' }], skip: (page - 1) * limit, take: limit, include: { category: true, reviews: { select: { rating: true } } } }),
  ]);
  return { products: products.map(present), total, page, pages: Math.ceil(total / limit) };
}
export async function productDetail(id) {
  const product = await db.product.findFirst({ where: { id: integer(id), deleted: false }, include: { category: true, reviews: { include: { user: { select: { name: true } } }, orderBy: { id: 'desc' }, take: 100 } } });
  if (!product) fail('Không tìm thấy sản phẩm.', 404);
  const stats = await db.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true });
  return { ...present(product), rating: stats._avg.rating || 0, reviewCount: stats._count, reviews: product.reviews };
}