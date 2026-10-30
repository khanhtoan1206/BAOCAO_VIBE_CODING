import { db } from '../config/db.js';

export function removeVietnameseAccents(str = '') {
  return str
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Phân tích intent người dùng: trích xuất ngân sách, danh mục, thương hiệu, mục đích sử dụng.
 */
export function parseSearchIntent(text = '') {
  const normalized = removeVietnameseAccents(text);
  const originalLower = text.toLowerCase();

  let maxPrice = null;
  let minPrice = null;

  // 1. Phân tích giá / ngân sách
  // "dưới 5 triệu", "duoi 5tr", "< 5tr", "5 trieu do lai", "<= 20 triệu"
  const underMatch = normalized.match(/(?:duoi|<|<=|toi da|do lai)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|d|vnd)?/i)
    || originalLower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\s*(?:đổ lại|trở xuống)/i);
  if (underMatch) {
    const num = parseFloat(underMatch[1].replace(',', '.'));
    const unit = underMatch[2] || 'trieu';
    if (unit === 'trieu' || unit === 'tr' || num <= 100) {
      maxPrice = Math.round(num * 1000000);
    } else if (unit === 'k' || unit === 'nghin') {
      maxPrice = Math.round(num * 1000);
    } else {
      maxPrice = Math.round(num);
    }
  }

  // "khoảng 10 triệu", "tam 10tr", "10-15 triệu"
  const rangeMatch = normalized.match(/(?:tu\s*)?(\d+(?:[.,]\d+)?)\s*(?:den|-)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr)/i);
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1].replace(',', '.'));
    const maxVal = parseFloat(rangeMatch[2].replace(',', '.'));
    minPrice = Math.round(minVal * 1000000);
    maxPrice = Math.round(maxVal * 1000000);
  } else if (!maxPrice) {
    const approxMatch = normalized.match(/(?:tam|khoang|co|ngan sach)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr)/i);
    if (approxMatch) {
      const val = parseFloat(approxMatch[1].replace(',', '.'));
      const target = Math.round(val * 1000000);
      minPrice = Math.max(0, Math.round(target * 0.7));
      maxPrice = Math.round(target * 1.3);
    }
  }

  // 2. Danh mục
  let categoryNames = [];
  if (/\b(dien thoai|smartphone|phone|iphone|galaxy|dt)\b/i.test(normalized)) {
    categoryNames.push('Điện thoại');
  }
  if (/\b(laptop|may tinh xach tay|macbook|notebook)\b/i.test(normalized)) {
    categoryNames.push('Laptop');
  }
  if (/\b(may tinh bang|tablet|ipad)\b/i.test(normalized)) {
    categoryNames.push('Máy tính bảng');
  }
  if (/\b(tai nghe|headphone|earphone|airpod|bluetooth)\b/i.test(normalized)) {
    categoryNames.push('Tai nghe');
  }
  if (/\b(sac|cap|pin du phong|powerbank|cu sac)\b/i.test(normalized)) {
    categoryNames.push('Sạc, cáp và pin dự phòng');
  }
  if (/\b(ban phim|chuot|phu kien|lot chuot|keyboard|mouse)\b/i.test(normalized)) {
    categoryNames.push('Bàn phím, chuột và phụ kiện máy tính');
    categoryNames.push('Phụ kiện');
  }

  // 3. Thương hiệu
  const brands = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'ASUS', 'Lenovo', 'Dell', 'HP', 'Acer', 'Sony', 'Logitech'];
  let matchedBrand = null;
  for (const b of brands) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
      matchedBrand = b;
      break;
    }
  }

  // 4. Phân khúc / Mục đích sử dụng
  let segment = null;
  if (/\b(gaming|choi game|game|do hoa)\b/i.test(normalized)) {
    segment = 'gaming';
  } else if (/\b(van phong|sinh vien|cntt|lap trinh|hoc tap|hoc code|it)\b/i.test(normalized)) {
    segment = 'office';
  }

  return { minPrice, maxPrice, categoryNames, brand: matchedBrand, segment, raw: text };
}

/**
 * Truy vấn sản phẩm liên quan từ SQLite dựa trên câu hỏi
 */
export async function findRelevantProducts(userMessage) {
  const intent = parseSearchIntent(userMessage);

  const where = { deleted: false };

  if (intent.categoryNames.length > 0) {
    where.category = { name: { in: intent.categoryNames } };
  }

  if (intent.minPrice || intent.maxPrice) {
    where.price = {};
    if (intent.minPrice) where.price.gte = intent.minPrice;
    if (intent.maxPrice) where.price.lte = intent.maxPrice;
  }

  if (intent.brand) {
    where.brand = { contains: intent.brand };
  }

  if (intent.segment && intent.categoryNames.includes('Laptop')) {
    where.OR = [
      { segment: intent.segment },
      { name: { contains: intent.segment === 'gaming' ? 'Gaming' : 'Laptop' } },
    ];
  }

  // Nếu không có intent lọc cụ thể, tìm kiếm theo từ khóa trong tên
  if (intent.categoryNames.length === 0 && !intent.maxPrice && !intent.brand) {
    const cleanWord = userMessage.trim().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9\s]/g, ' ');
    const tokens = cleanWord.split(/\s+/).filter(w => w.length >= 2 && !['chào', 'tôi', 'bạn', 'muốn', 'mua', 'cần', 'cho', 'nào', 'có', 'không'].includes(w.toLowerCase()));
    if (tokens.length > 0) {
      where.OR = tokens.slice(0, 3).map(token => ({
        name: { contains: token }
      }));
    } else {
      // Nếu câu hỏi chung chung (ví dụ "tư vấn sản phẩm nổi bật"), lấy các sản phẩm featured
      where.featured = true;
    }
  }

  let products = await db.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: [
      { featured: 'desc' },
      { stock: 'desc' },
      { price: 'asc' },
    ],
    take: 6,
  });

  // Nếu bộ lọc quá chặt (ví dụ brand + giá không có), thử nới lỏng bỏ brand để có sản phẩm thay thế phù hợp ngân sách
  if (products.length === 0 && intent.brand && (intent.categoryNames.length > 0 || intent.maxPrice)) {
    const relaxedWhere = { ...where };
    delete relaxedWhere.brand;
    products = await db.product.findMany({
      where: relaxedWhere,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [
        { featured: 'desc' },
        { stock: 'desc' },
        { price: 'asc' },
      ],
      take: 4,
    });
  }

  // Định dạng dữ liệu cho Gemini & Frontend
  const frontendProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand || p.category?.name || 'KT-SHOP',
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    image: p.image,
    categoryName: p.category?.name || '',
    link: `/products/${p.id}`,
    segment: p.segment || '',
  }));

  const geminiContext = products.map(p => {
    let parsedSpecs = {};
    try {
      parsedSpecs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
    } catch {
      parsedSpecs = {};
    }

    return {
      id: p.id,
      ten: p.name,
      thuong_hieu: p.brand || 'KT-SHOP',
      danh_muc: p.category?.name,
      gia_ban_vnd: p.price,
      gia_goc_vnd: p.originalPrice,
      tinh_trang: p.stock > 0 ? `Còn hàng (${p.stock} sản phẩm)` : 'Tạm hết hàng',
      phan_khuc: p.segment || 'tiêu chuẩn',
      thong_so_ky_thuat: parsedSpecs,
      bao_hanh: p.warranty || 'Bảo hành chính hãng KT-SHOP',
      link_chi_tiet: `/products/${p.id}`,
    };
  });

  return {
    frontendProducts,
    geminiContext,
    matchedCount: products.length,
    intent,
  };
}
