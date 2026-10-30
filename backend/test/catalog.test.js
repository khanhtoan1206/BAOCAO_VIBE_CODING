import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { listProducts, productDetail } from '../src/services/catalog.service.js';
after(() => db.$disconnect());
test('catalog reads SQLite, filters, sorts, paginates and loads details', async () => {
  const category = await db.category.create({ data: { name: `Test-${Date.now()}` } });
  const product = await db.product.create({ data: { name: 'Test catalog device', brand:'PremiumTestBrand', segment:'gaming', description: 'test', image: '/images/category-0.svg', price: 1000, originalPrice: 1500, stock: 2, categoryId: category.id } });
  try {
    const result = await listProducts({ q: 'Test catalog', category: String(category.id), min: '900', max: '1100', limit: '1', sort: 'price_asc' });
    assert.equal(result.total, 1); assert.equal(result.products[0].id, product.id);
    assert.equal((await listProducts({q:'PremiumTestBrand',brand:'PremiumTestBrand',stock:'in',segment:'gaming',sale:'true',sort:'name_asc'})).products[0].id,product.id);
    assert.equal((await listProducts({brand:'PremiumTestBrand',stock:'out'})).total,0);
    assert.equal((await listProducts({category:String(category.id),sort:'name_desc'})).products[0].id,product.id);
    await assert.rejects(()=>listProducts({stock:'invalid'}));
    await assert.rejects(()=>listProducts({brand:['invalid']}));
    assert.equal((await productDetail(product.id)).category.id, category.id);
    assert.equal((await listProducts({ category: String(category.id), page: '2', limit: '1' })).products.length, 0);
    await assert.rejects(() => listProducts({ min: '200', max: '100' }));
  } finally { await db.product.delete({ where: { id: product.id } }); await db.category.delete({ where: { id: category.id } }); }
});