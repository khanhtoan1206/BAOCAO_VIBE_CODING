# Nâng cấp KT-SHOP — 24/10/2026

## Đã triển khai
- Header sticky, gợi ý tìm kiếm API có debounce/hủy request, giỏ hàng và liên kết quản trị theo quyền.
- Trang chủ có slider (dừng/tự chuyển, giảm chuyển động), danh mục, bộ sưu tập, banner và thương hiệu.
- Font Be Vietnam Pro lưu nội bộ kèm OFL; Lucide và Recharts có sẵn, không thêm framework.
- Card, gallery/phóng to hỗ trợ bàn phím, số lượng mua, mua ngay qua giỏ hàng, thông số, mô tả, đánh giá thật và liên quan.
- API tìm tên/thương hiệu, danh mục, khoảng giá, thương hiệu, tồn kho, nhóm sản phẩm, giảm giá; sắp xếp tên/giá/ngày tạo và phân trang.
- Bán chạy tính theo số lượng sản phẩm trong đơn COMPLETED, không tạo số bán giả.
- COD và thanh toán mô phỏng, xác nhận đơn qua API có kiểm tra chủ sở hữu, giữ transaction tồn kho/tổng tiền.
- Admin sidebar, bảng sản phẩm có ảnh, tìm kiếm/lọc/phân trang phía client, khách hàng không lộ password, biểu đồ doanh thu/đơn hàng và tồn kho thấp.
- Migration chỉ thêm trường; seed dùng slug duy nhất và update rỗng, không ghi đè sản phẩm có sẵn.

## Dữ liệu
- 120 mẫu mới: điện thoại 30; laptop 25 (gaming 12, văn phòng 13); tablet 15; tai nghe 20; sạc/cáp/pin 15; phụ kiện máy tính 15.
- Tổng 132 sản phẩm, giữ nguyên 12 mẫu cũ.
- 240 SVG nội bộ phân biệt bằng thiết bị, nhãn, màu và góc minh họa. Đây là ảnh minh họa, không phải ảnh model thật.
- Các tên theo thương hiệu là sản phẩm giả định và ghi Demo. Không khẳng định cấu hình/giá/bảo hành thương mại.
- Backup: `D:\Vibe coding\KT-SHOP\backups\pre-premium-20261024.db`. File chứa dữ liệu riêng tư; không đưa lên repository công khai.

## Kiểm tra
- `npm test`: 11 test đạt, bổ sung assertions bộ lọc, COD, phân quyền khách hàng, bán chạy; test commerce có đăng nhập, CRUD, giỏ hàng, transaction cạnh tranh tồn kho.
- `npm run build`: TypeScript và Vite production build.
- `npm run test:smoke`: HTTP frontend, API proxy, deep link, TSX.
- `npm run test:audit`: đối chiếu từng trường dữ liệu cũ với backup; đủ phân bổ demo và 240 SVG.
- `npm run test:browser`: Chrome headless desktop 1440x1000 và mobile 390x844; trang chủ, gợi ý, lọc, gallery, zoom, không tràn ngang, redirect Admin chưa đăng nhập; không lỗi JS uncaught.
- Ảnh chụp tại `D:\Vibe coding\KT-SHOP\docs\screenshots`.
- Test browser dùng Chrome Windows tại vị trí trong script, không cài thêm thư viện. Test audit cần backup nói trên và sẽ báo sai nếu dữ liệu cũ đã được thay đổi hợp lệ sau nghiệm thu.

## Chưa hoàn thành / giới hạn
- Chưa có ảnh chụp và model thương mại xác minh; bộ sạc/cáp/pin và phụ kiện PC hiện là nhóm mẫu chung, chưa có hình riêng cho từng loại con.
- Chưa có quản lý biến thể giá/tồn kho. Tất cả mẫu mới là cấu hình cố định; không hiển thị chọn biến thể giả.
- Chưa có dữ liệu chiến dịch có ngày kết thúc: không hiển thị Flash Sale countdown giả; có danh mục sản phẩm giảm giá.
- Hotline, vận chuyển và đổi trả chưa có cấu hình kinh doanh; không bịa số điện thoại/chính sách.
- Admin chưa có form chỉnh sửa toàn bộ metadata mới (gallery, specs, brand); form cũ vẫn sửa dữ liệu cơ bản và không xóa metadata hiện có.
- Admin sản phẩm phân trang phía client; endpoint vẫn trả danh sách. Cần phân trang server nếu dữ liệu lớn.
- Kiểm thử đăng nhập/checkout/Admin CRUD là HTTP integration; chưa tự động hóa toàn bộ các thao tác này bằng giao diện trình duyệt, chưa kiểm tra Safari/Firefox hoặc tablet riêng.
- Không phải bản sẵn sàng vận hành thương mại thật; thanh toán không kết nối cổng thanh toán.

## Chạy dự án
Tại `D:\Vibe coding\KT-SHOP`, chạy `npm run dev`. Nếu backend đang chạy từ trước nâng cấp, khởi động lại để nhận Prisma client/schema mới.