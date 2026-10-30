import { useEffect, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Database, Laptop, RefreshCw, Server, Smartphone, Tablet, Headphones, TriangleAlert } from 'lucide-react';
import { getHealth, type Health } from '../services/api';

export function SystemPage() {
  const [attempt, setAttempt] = useState(0);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getHealth(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setHealth(data); })
      .catch(() => { if (!controller.signal.aborted) { setHealth(null); setError('Chưa kết nối được máy chủ. Hãy kiểm tra backend và thử lại.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  return <>
    <section className="hero rounded-3xl p-7 text-white md:p-14">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-xs font-semibold tracking-widest text-blue-200"><Activity size={15} /> KT-SHOP · ĐANG PHÁT TRIỂN</span>
      <div className="mt-8 grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
        <div><h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">Công nghệ mới.<br /><span className="text-blue-300">Trải nghiệm mới.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">Nền tảng mua sắm điện thoại, laptop và phụ kiện công nghệ. Chúng mình đang xây dựng trải nghiệm mua sắm dành cho bạn.</p>
          <a href="#connection" className="mt-8 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500">Kiểm tra hệ thống <ArrowRight size={18} /></a>
        </div>
        <div className="grid grid-cols-2 gap-3" aria-label="Lĩnh vực kinh doanh dự kiến">
          {[{ icon: Smartphone, label: 'Điện thoại' }, { icon: Laptop, label: 'Laptop' }, { icon: Tablet, label: 'Máy tính bảng' }, { icon: Headphones, label: 'Phụ kiện' }].map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"><Icon className="mx-auto mb-4 text-blue-300" size={36} strokeWidth={1.5} /><span className="text-sm text-slate-200">{label}</span></div>)}
        </div>
      </div>
    </section>
    <section id="connection" className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Trạng thái dịch vụ</p><h2 className="mt-2 text-2xl font-bold">Kết nối nền tảng</h2></div><Server className="text-blue-600" size={30} /></div>
        <div className="mt-6" aria-live="polite" aria-busy={loading}>
          {loading ? <div className="animate-pulse space-y-3" role="status"><p>Đang kiểm tra API…</p><div className="h-5 w-3/4 rounded bg-slate-100" /><div className="h-5 w-1/2 rounded bg-slate-100" /></div> : error ? <div role="alert" className="flex gap-3 rounded-xl bg-red-50 p-4 text-red-700"><TriangleAlert className="shrink-0" /><p>{error}</p></div> : <div className="rounded-xl bg-emerald-50 p-5"><p className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 size={20} /> Backend đang hoạt động</p><dl className="mt-4 grid gap-2 text-sm text-slate-600"><div><dt className="inline font-semibold">Dịch vụ: </dt><dd className="inline">{health?.service}</dd></div><div><dt className="inline font-semibold">Kiểm tra lúc: </dt><dd className="inline">{health && new Date(health.timestamp).toLocaleString('vi-VN')}</dd></div></dl></div>}
        </div>
        <button disabled={loading} onClick={() => setAttempt((value) => value + 1)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Kiểm tra lại</button>
      </div>
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8"><Database className="text-blue-600" size={30} /><h2 className="mt-4 text-xl font-bold">SQLite đã kết nối</h2><p className="mt-3 leading-7 text-slate-600">Danh mục, sản phẩm, tài khoản, giỏ hàng và đơn hàng được lưu trong SQLite. Trở về trang chủ để mua sắm và thanh toán giả lập.</p><p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Trạng thái API không đồng nghĩa database hay chức năng bán hàng đã sẵn sàng.</p></aside>
    </section>
  </>;
}