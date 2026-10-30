# Nhật ký Vibe Coding

## 24/10/2026 — Triển khai thương mại điện tử

- Theo yêu cầu mới, tiếp tục qua các nhóm chức năng không dừng chờ xác nhận giữa các giai đoạn.
- Tạo Prisma schema, migration init, SQLite, seed 4 danh mục/12 sản phẩm, ảnh SVG local.
- Triển khai catalog, JWT/bcrypt, quyền USER/ADMIN, reviews, cart, checkout transaction và orders.
- Triển khai dashboard, CRUD sản phẩm/xóa mềm, danh mục và chuyển trạng thái đơn.
- Thay trang chủ bằng catalog thực; thêm trang xác thực, chi tiết, giỏ/checkout, đơn hàng và Admin.
- Tạo admin local với mật khẩu ngẫu nhiên trong file gitignored, không in secret vào log.
- Build đạt; tách lazy Admin để loại cảnh báo chunk >500KB.
- 11 test đạt; integration test có nhiều assertions bao phủ toàn luồng, gồm 2 yêu cầu checkout tranh cùng tồn kho cuối (1 thành công, 1 trả 409).
- Smoke frontend/proxy/deep-link/TSX đạt. Chưa kiểm thử browser E2E hoặc mobile trực quan.
- Không triển khai chatbot trước khi nghiệm thu chức năng bắt buộc.

## 24/10/2026 — Giai đoạn 1

- Product Manager yêu cầu hệ thống KT-SHOP full-stack, stack cụ thể và nghiệm thu từng giai đoạn.
- Kiểm tra workspace: có website portfolio; chưa có thư mục KT-SHOP.
- Quyết định tạo thư mục riêng, không sửa hoặc xóa portfolio.
- Môi trường: Node.js v22.23.2, npm 10.9.8, Git 2.53.0.
- Tạo cấu trúc, tài liệu kế hoạch và script kiểm tra không dùng dependency ngoài.
- Chưa cài thư viện, khởi tạo database, triển khai API hay giao diện.
- Một đoạn master prompt bị công cụ rút gọn; ghi nhận cần đối chiếu trước khi chốt nghiệp vụ.
- Kiểm tra thực tế: `npm run check:structure` PASS 27/27 đường dẫn, 0 lỗi.
- `node --check scripts/check-structure.mjs` thành công, không có lỗi cú pháp.
- Chưa chạy kiểm thử nghiệp vụ vì chưa triển khai ứng dụng.

## 24/10/2026 — Giai đoạn 2

- Tạo npm workspaces, cài dependencies frontend/backend và khóa phiên bản.
- Cài Prisma CLI/client/SQLite adapter 7.10.1; không chọn bản CLI release candidate 8 mặc định từ registry.
- Viết React/TypeScript/Tailwind với routing, Axios, trạng thái loading/error/retry và health API thực tế. Không tạo sản phẩm hoặc thao tác mua hàng giả.
- Viết Express routes/controller/service health, cấu hình môi trường, CORS, giới hạn body và lỗi JSON.
- Tạo setup .env không ghi đè, secret ngẫu nhiên; script dev chạy hai ứng dụng bằng Node.
- Build PASS; backend tests PASS 9/9; smoke HTTP/proxy/routing PASS; structure PASS 27/27.
- Prisma CLI chạy thành công; npm audit production dependencies báo 0 vulnerabilities.
- Cảnh báo: dependency gián tiếp prebuild-install deprecated. Driver SQLite vẫn chạy test thành công.
- Chưa kiểm thử trực quan trình duyệt/mobile. Chưa có schema, migration, seed hoặc authentication API.
- Dừng tại Giai đoạn 2, chờ Product Manager xác nhận Giai đoạn 3.