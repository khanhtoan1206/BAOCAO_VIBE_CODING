import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { StoreHeader, StoreFooter } from './components/StoreHeader';
import { SystemPage } from './pages/SystemPage';
import { PremiumCatalogPage as CatalogPage } from './pages/PremiumCatalogPage';
import { PremiumProductPage as ProductPage } from './pages/PremiumProductPage';
import { AuthPage } from './pages/AuthPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { lazy, Suspense } from 'react';
const LazyAdmin = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
function AdminPage(){return <Suspense fallback={<div className="panel">Đang tải quản trị…</div>}><LazyAdmin/></Suspense>;}
import { useShop } from './contexts/ShopContext';
function Protected({children,admin=false}:{children:React.ReactNode;admin?:boolean}){const shop=useShop();if(!shop.ready)return <div className="panel">Đang kiểm tra phiên…</div>;if(!shop.user)return <Navigate to="/login" replace/>;if(admin&&shop.user.role!=='ADMIN')return <div className="panel">Bạn không có quyền quản trị.</div>;return children;}
export function App(){return <><a className="skip-link" href="#main">Đến nội dung chính</a><StoreHeader/><main id="main" className="mx-auto min-h-[65vh] max-w-7xl px-5 py-8"><Routes><Route path="/" element={<CatalogPage/>}/><Route path="/products/:id" element={<ProductPage/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/><Route path="/cart" element={<Protected><CartPage/></Protected>}/><Route path="/orders/:id/success" element={<Protected><OrderSuccessPage/></Protected>}/><Route path="/orders" element={<Protected><OrdersPage/></Protected>}/><Route path="/admin" element={<Protected admin><AdminPage/></Protected>}/><Route path="/system" element={<SystemPage/>}/><Route path="*" element={<div className="panel">Không tìm thấy trang. <Link to="/">Về cửa hàng</Link></div>}/></Routes></main><StoreFooter/></>;}