# Kế hoạch kiểm thử

## Kết quả mới nhất — thương mại điện tử

`npm test`: 11/11 test đạt. Test commerce là một luồng HTTP tích hợp chứa nhiều assertions: register, email trùng, login đúng/sai, 401/403, CRUD sản phẩm/danh mục, lọc/tìm kiếm, thêm/sửa/xóa cart, tổng tiền, checkout vượt tồn, rollback, tạo đơn, lịch sử và quyền sở hữu, đánh giá, trạng thái đơn, doanh thu, xóa mềm bảo toàn lịch sử. Hai checkout đồng thời trên tồn cuối cho kết quả 201 và 409, tồn còn 0.

`npm run build`: đạt TypeScript/Vite; Admin lazy-loaded. `npm run test:smoke`: đạt HTTP frontend/proxy/routing/TSX. Migration init và seed đã chạy thực tế. Browser E2E, UI mobile và chatbot CHƯA KIỂM THỬ. Các ghi chép Giai đoạn 1/2 phía dưới là lịch sử.

## Giai đoạn 1

Lệnh: `npm run check:structure`. Kiểm tra thư mục và sự hiện diện của tài liệu không rỗng; không kiểm thử nghiệp vụ.

## Các ca nghiệm thu nghiệp vụ — tất cả CHƯA CHẠY

## Kết quả Giai đoạn 2

- `npm run build`: PASS TypeScript và Vite production build.
- `npm test`: PASS 9/9, gồm health, 404, JSON sai, body quá lớn, CORS hợp lệ/không hợp lệ, preflight, SQLite in-memory, bcrypt/JWT dependency smoke.
- `npm run test:smoke`: PASS frontend HTTP, API proxy, deep-link `/system`, TSX transform. Đây là HTTP test, không phải browser E2E.
- `npm run check:structure`: PASS 27/27.
- Prisma CLI `--version`: chạy trên Windows, CLI và client 7.10.1.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities tại thời điểm chạy; không phải chứng nhận an toàn toàn bộ ứng dụng.
- Chưa test browser/mobile, đăng ký/đăng nhập, Prisma query/migration hoặc nghiệp vụ.

## Các ca nghiệp vụ dự kiến

1. Đăng ký hợp lệ; dữ liệu được lưu, mật khẩu không lưu rõ.
2. Email trùng bị từ chối.
3. Đăng nhập đúng thành công; sai mật khẩu bị từ chối.
4. USER không truy cập được API ADMIN; thiếu/hết hạn JWT bị từ chối.
5. Tìm kiếm, danh mục, khoảng giá, sắp xếp và phân trang chính xác.
6. Thêm sản phẩm vào giỏ.
7. Tăng, giảm, xóa dòng giỏ; chặn số lượng không hợp lệ.
8. Tổng tiền đúng, không tin đơn giá từ frontend.
9. Chặn đặt vượt tồn kho, kể cả yêu cầu đồng thời.
10. Đặt hàng thành công; tạo đơn và trừ tồn kho atomic.
11. Lịch sử đúng chủ tài khoản; không đọc được đơn người khác.
12. ADMIN thêm, sửa, xóa mềm sản phẩm; lịch sử đơn được bảo toàn.
13. ADMIN cập nhật trạng thái đúng quy tắc, chặn chuyển trạng thái sai.
14. Dashboard khớp dữ liệu trong database và định nghĩa doanh thu đã chốt.
15. Chatbot hoạt động khi có key; thiếu key/lỗi provider không ảnh hưởng bán hàng.
16. Giao diện mobile không tràn ngang; menu, biểu mẫu, bảng sử dụng được.
17. Refresh đường dẫn React Router không 404 trong môi trường chạy được hỗ trợ.
18. Frontend build thành công; backend, integration tests không có lỗi nghiêm trọng.

Bổ sung kiểm thử CRUD danh mục, đánh giá, validate đầu vào và giới hạn chatbot khi chốt yêu cầu. Không gửi khóa API thật vào test hoặc commit.