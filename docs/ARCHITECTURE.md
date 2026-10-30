# Kiến trúc dự kiến

Trạng thái Giai đoạn 2: đã có luồng React → Axios → Vite proxy → Express routes → controller → health service. Phần Prisma/database và nghiệp vụ bên dưới vẫn là thiết kế.

Monorepo dùng npm workspaces, một package-lock.json tại gốc. Backend dùng JavaScript ESM; frontend dùng TypeScript strict. Script phát triển dùng Node spawn thay vì cú pháp shell phụ thuộc Unix để chạy trên Windows. Tailwind tích hợp bằng plugin Vite. Cấu hình môi trường backend được đọc theo đường dẫn file, không phụ thuộc thư mục gọi lệnh.

React → Axios → Express Routes → Middleware → Controllers → Services → Prisma → SQLite.

- React quản lý giao diện; không trực tiếp truy cập database.
- Routes ánh xạ HTTP request; middleware kiểm tra JWT và quyền trước controller.
- Controllers nhận dữ liệu đã validate, gọi service, trả response.
- Services xử lý nghiệp vụ, giao dịch đặt hàng và quy tắc chuyển trạng thái.
- Prisma truy cập SQLite; migration quản lý thay đổi cấu trúc.
- Context phục vụ trạng thái đăng nhập và giỏ hàng; hooks dùng chung logic giao diện.

## Nguyên tắc triển khai

- Server là nơi quyết định giá, quyền, tồn kho và tổng đơn; không tin giá gửi từ client.
- Tạo đơn và trừ tồn kho trong cùng transaction; kiểm thử đặt hàng đồng thời.
- Mật khẩu chỉ lưu dạng bcrypt hash; không đưa hash vào response.
- API admin phải kiểm tra quyền ở backend, không chỉ ẩn nút frontend.
- Tiền VNĐ lưu số nguyên; lưu bản chụp tên và giá ở dòng đơn hàng.
- Xóa mềm sản phẩm để không làm mất lịch sử đơn.
- Khóa chatbot chỉ có ở backend; giới hạn nội dung, độ dài và tần suất.
- Giao diện có loading, empty, error states và responsive.

Cần chốt chính sách phiên JWT, lưu giỏ hàng, đánh giá sản phẩm, chuyển trạng thái đơn và định nghĩa doanh thu trước khi triển khai các phần liên quan.